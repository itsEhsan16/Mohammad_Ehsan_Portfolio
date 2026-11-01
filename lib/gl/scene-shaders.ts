/*
 * GLSL 300 es for the home scene (lib/gl/scene.ts).
 *
 * Pass 1 renders the terrain and the figure into an offscreen target with two
 * outputs:
 *   0: lit colour (rgb) + terrain contour lines (a)
 *   1: data: shade (r), rim light (g), id (b: 0 sky, 0.5 ground, 1 figure), fog (a)
 * Pass 2 (compositeFrag) turns that into dither on the page, in two layers:
 * ground first, then the figure after the painted name is drawn.
 */

/** Shared vertex shader. With SKINNED, OGL's GLTFSkin supplies bone matrices in a texture. */
export function sceneVert({ skinned = false, uv = false } = {}) {
  return /* glsl */ `#version 300 es
precision highp float;
${skinned ? "#define SKINNED" : ""}
${uv ? "#define HAS_UV" : ""}
in vec3 position;
in vec3 normal;
#ifdef HAS_UV
in vec2 uv;
out vec2 vUv;
#endif
#ifdef SKINNED
in vec4 skinIndex;
in vec4 skinWeight;
uniform sampler2D boneTexture;
uniform int boneTextureSize;
mat4 bone(float i) {
  int j = int(i + 0.5) * 4;
  int x = j % boneTextureSize;
  int y = j / boneTextureSize;
  return mat4(
    texelFetch(boneTexture, ivec2(x, y), 0),
    texelFetch(boneTexture, ivec2(x + 1, y), 0),
    texelFetch(boneTexture, ivec2(x + 2, y), 0),
    texelFetch(boneTexture, ivec2(x + 3, y), 0));
}
#endif
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
out vec3 vNormal;
out vec3 vWorld;
void main() {
  vec4 p = vec4(position, 1.0);
  vec3 n = normal;
#ifdef SKINNED
  mat4 skin = skinWeight.x * bone(skinIndex.x) + skinWeight.y * bone(skinIndex.y)
            + skinWeight.z * bone(skinIndex.z) + skinWeight.w * bone(skinIndex.w);
  p = skin * p;
  n = mat3(skin) * n;
#endif
#ifdef HAS_UV
  vUv = uv;
#endif
  vec4 world = modelMatrix * p;
  vWorld = world.xyz;
  vNormal = normalize(mat3(modelMatrix) * n);
  gl_Position = projectionMatrix * viewMatrix * world;
}`;
}

/** Ground: grazing light, contour lines every 0.4 m, a soft shadow under the feet, fog with distance. */
export const terrainFrag = /* glsl */ `#version 300 es
precision highp float;
uniform vec3 uSun;
uniform vec3 cameraPosition;
uniform float uFeetY;
uniform float uContact;   // 0..1: the contact shadow only shows when a figure stands there
in vec3 vNormal;
in vec3 vWorld;
layout(location = 0) out vec4 outColor;
layout(location = 1) out vec4 outData;
void main() {
  vec3 n = normalize(vNormal);
  float lam = max(dot(n, uSun), 0.0);
  float dist = distance(cameraPosition, vWorld);
  // snow: bright close to the viewer, shaped by the light further out
  float shade = 0.42 + 0.58 * lam;
  shade = mix(shade, 0.97, (1.0 - smoothstep(3.0, 16.0, dist)) * 0.75);
  // contour lines, antialiased, fading out with distance; offset half a step so
  // the flat pad under the feet sits between two lines, not on one
  float h = (vWorld.y - uFeetY) * 2.5 + 0.5;
  float w = max(fwidth(h), 1e-4);
  float contour = 1.0 - min(abs(fract(h - 0.5) - 0.5) / w, 1.0);
  contour *= 1.0 - smoothstep(10.0, 28.0, dist);
  // soft contact shadow where the figure stands
  float r = length(vWorld.xz);
  shade *= 1.0 - 0.5 * uContact * exp(-r * r / 0.09);
  float fog = 1.0 - exp(-max(dist - 7.0, 0.0) * 0.045);
  outColor = vec4(vec3(shade), contour);
  outData = vec4(shade, 0.0, 0.5, fog);
}`;

/** Figure: key light and rim light, scaled by the brightness of its texture (likeness lives there). */
export function figureFrag({ uv = false, alphaMask = false } = {}) {
  return /* glsl */ `#version 300 es
precision highp float;
${uv ? "#define HAS_UV" : ""}
${alphaMask ? "#define ALPHA_MASK" : ""}
uniform vec3 cameraPosition;
uniform vec3 uKey;
uniform vec4 uBase;
uniform float uAlphaCutoff;
#ifdef HAS_UV
uniform sampler2D tBase;
uniform float uHasBase;
in vec2 vUv;
#endif
in vec3 vNormal;
in vec3 vWorld;
layout(location = 0) out vec4 outColor;
layout(location = 1) out vec4 outData;
float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
void main() {
  vec4 base = uBase;
#ifdef HAS_UV
  if (uHasBase > 0.5) base *= texture(tBase, vUv);
#endif
#ifdef ALPHA_MASK
  if (base.a < uAlphaCutoff) discard;
#endif
  vec3 n = normalize(vNormal);
  vec3 v = normalize(cameraPosition - vWorld);
  if (dot(n, v) < 0.0) n = -n;
  float lam = max(dot(n, uKey), 0.0);
  float rim = pow(1.0 - max(dot(n, v), 0.0), 3.0);
  float shade = (0.18 + 0.82 * lam) * (0.35 + 0.65 * luma(base.rgb)) + 0.55 * rim;
  vec3 lit = base.rgb * (0.3 + 0.7 * lam) + rim * 0.3;
  outColor = vec4(lit, 0.0);
  outData = vec4(clamp(shade, 0.0, 1.0), rim, 1.0, 0.0);
}`;
}

const common = /* glsl */ `
float bayer2(vec2 a) { a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float bayer8(vec2 a) { return bayer4(0.5 * a) * 0.25 + bayer2(a); }
`;

/**
 * Turns pass 1 into dither over the stage. uLayer 0 draws the ground (before
 * the painted name), 1 the figure (after it), so the name sits between them.
 */
export const compositeFrag = /* glsl */ `#version 300 es
precision highp float;
${common}
uniform sampler2D tColor;
uniform sampler2D tData;
uniform sampler2D tTrail;
uniform float uHasTrail;
uniform sampler2D tName;  // the painted name's text mask
uniform float uHasName;
uniform vec4 uNameMap;    // stage uv → name uv: offset (xy), scale (zw)
uniform vec2 uPlane;      // stage size, CSS px
uniform float uDpr;
uniform float uLayer;
uniform float uInvert;    // 1 on the light theme: dots mean shadow instead of light
uniform float uReveal;    // dithered print-in, 0..1
uniform float uFigure;    // figure fade-in, 0..1
uniform vec3 uFg;
uniform vec3 uBg;
uniform vec3 uSignal;
in vec2 vUv;
out vec4 outColor;

vec4 dataAt(vec2 cssPx) { return texture(tData, clamp(cssPx / uPlane, 0.0, 1.0)); }

void main() {
  vec2 p = vUv * uPlane;                       // CSS px, origin bottom-left of the stage
  float trail = uHasTrail > 0.5 ? texture(tTrail, vUv).r : 0.0;
  float k = smoothstep(0.08, 0.55, trail);
  float reveal = step(bayer8(gl_FragCoord.xy / max(uDpr, 1.0)), uReveal * 1.001 - 0.0001 + step(0.999, uReveal));

  if (uLayer < 0.5) {
    // ground: round dots in 3 px cells
    float cell = 3.0;
    vec2 ci = floor(p / cell);
    vec2 cc = (ci + 0.5) * cell;
    vec4 d = dataAt(cc);
    if (d.b < 0.25 || d.b > 0.75) discard;
    float s = mix(d.r, 1.0 - d.r, uInvert);
    float dens = s * (1.0 - 0.92 * d.a) * mix(1.0, 0.82, uInvert);
    // faint topographic lines, always in ink: fewer light dots on ink, more dark dots on paper
    float contour = texture(tColor, clamp(cc / uPlane, 0.0, 1.0)).a;
    float line = contour * 0.55 * (1.0 - d.a);
    dens = uInvert > 0.5 ? max(dens, line) : dens * (1.0 - line);
    float on = step(bayer8(ci), dens);
    // a bright edge along the skyline: the cell above is sky
    float above = dataAt(cc + vec2(0.0, cell)).b;
    on = max(on, step(above, 0.25) * (1.0 - 0.6 * d.a));
    // keep clear of the figure (a thin gap separates it from the ground)…
    float g = 3.0;
    float nearFig = max(max(dataAt(cc + vec2(g, 0.0)).b, dataAt(cc - vec2(g, 0.0)).b), max(dataAt(cc + vec2(0.0, g)).b, dataAt(cc - vec2(0.0, g)).b));
    on *= 1.0 - step(0.75, nearFig);
    // …and around the painted name, which reads as cut out of the landscape
    if (uHasName > 0.5) {
      vec2 nuv = vUv * uNameMap.zw + uNameMap.xy;
      if (nuv.x > -0.05 && nuv.x < 1.05 && nuv.y > -0.05 && nuv.y < 1.05) {
        float nm = textureLod(tName, clamp(nuv, 0.0, 1.0), 3.0).a;
        on *= 1.0 - smoothstep(0.03, 0.18, nm);
      }
    }
    vec2 inCell = fract(p / cell) - 0.5;
    float aa = 0.6 / (cell * max(uDpr, 1.0));
    float dotA = 1.0 - smoothstep(0.42 - aa, 0.42 + aa, length(inCell));
    vec3 col = mix(uBg, uFg, on * dotA);
    // contours glow in signal orange under the cursor trail
    col = mix(col, uSignal, clamp(contour * k * 1.4, 0.0, 1.0));
    outColor = vec4(col, reveal);
    return;
  }

  // figure: 2 px cells, a slight RGB split and scan lines
  vec4 d = dataAt(p);
  if (d.b < 0.75) discard;
  float cell = 2.0;
  vec2 ci = floor(p / cell);
  float th = bayer8(ci);
  float off = 1.0;
  vec4 dl = dataAt(p + vec2(off, 0.0));
  vec4 dr = dataAt(p - vec2(off, 0.0));
  // the colour split only shows where the silhouette meets the ground or sky
  vec3 s3 = vec3(dl.b > 0.75 ? d.r : dl.r * 0.6, d.r, dr.b > 0.75 ? d.r : dr.r * 0.6);
  s3 = mix(s3, 1.0 - s3, uInvert);
  vec3 on = step(vec3(th), s3);
  float scan = 0.88 + 0.12 * sin(p.y * 3.14159265);
  vec3 dither = mix(uBg, uFg, on) * mix(scan, 1.0, uInvert);
  // the "render" shows through the trail: full colour with a signal rim and band
  vec3 render = texture(tColor, vUv).rgb;
  render = mix(render, uSignal, clamp(d.g * 1.6, 0.0, 1.0));
  float band = smoothstep(0.3, 0.5, k) - smoothstep(0.5, 0.7, k);
  vec3 col = mix(dither, render, k);
  col = mix(col, uSignal, band * 0.8);
  outColor = vec4(col, reveal * uFigure);
}`;
