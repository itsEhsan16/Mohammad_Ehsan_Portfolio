/* GLSL 300 es sources (template strings — no bundler loaders needed). */

/** Unit grid (x 0..1 left→right, y 0..1 top→bottom) placed in CSS px via uRect, mapped straight to clip space. */
export const planeVert = /* glsl */ `#version 300 es
precision highp float;
in vec2 position;
uniform vec4 uRect;      // left, top, width, height (CSS px, viewport space)
uniform vec2 uViewport;  // CSS px
uniform float uBend;     // px of vertical bow (scroll velocity)
out vec2 vUv;
void main() {
  vec2 px = uRect.xy + position * uRect.zw;
  px.y += sin(position.x * 3.14159265) * uBend;
  vec2 clip = vec2(px.x / uViewport.x * 2.0 - 1.0, 1.0 - px.y / uViewport.y * 2.0);
  vUv = vec2(position.x, 1.0 - position.y);
  gl_Position = vec4(clip, 0.0, 1.0);
}`;

const common = /* glsl */ `
float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
vec2 coverUv(vec2 uv, vec2 plane, vec2 image) {
  float rp = plane.x / plane.y;
  float ri = image.x / image.y;
  vec2 s = rp > ri ? vec2(1.0, ri / rp) : vec2(rp / ri, 1.0);
  return (uv - 0.5) * s + 0.5;
}
float bayer2(vec2 a) { a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float bayer8(vec2 a) { return bayer4(0.5 * a) * 0.25 + bayer2(a); }
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
`;

/**
 * Media plane. Variants:
 *  0 blueprint — Sobel edges + halftone + grid on ink, resolved to colour by a top-down sweep (uProgress) and a hover radial
 *  1 plain     — colour with a velocity RGB split
 *  2 stamp     — ink halftone on paper, hover develops to colour
 */
export const planeFrag = /* glsl */ `#version 300 es
precision highp float;
${common}
uniform sampler2D tMap;
uniform vec2 uImage;     // texture px
uniform vec2 uPlane;     // CSS px
uniform float uDpr;
uniform float uVariant;
uniform float uProgress;
uniform float uHover;
uniform vec2 uMouse;     // plane uv (y up)
uniform float uVelocity;
uniform float uTime;
uniform float uAlpha;
uniform vec3 uInk;
uniform vec3 uBone;
uniform vec3 uSignal;
in vec2 vUv;
out vec4 outColor;

vec3 tex(vec2 uv) { return texture(tMap, coverUv(uv, uPlane, uImage)).rgb; }

void main() {
  vec2 p = vUv * uPlane;                       // CSS px, origin bottom-left
  float shift = clamp(uVelocity, -60.0, 60.0) * 0.00035;
  vec3 col = vec3(tex(vUv + vec2(shift, 0.0)).r, tex(vUv).g, tex(vUv - vec2(shift, 0.0)).b);

  // hover radial (aspect-correct), grows from the cursor
  vec2 asp = vec2(uPlane.x / uPlane.y, 1.0);
  float hd = distance(vUv * asp, uMouse * asp);
  float hoverMask = smoothstep(0.15 + uHover * 1.6, 0.0 + uHover * 1.2, hd) * step(0.001, uHover);

  if (uVariant > 1.5) {
    // stamp: ink halftone on paper
    float pitch = 6.0;
    vec2 cell = (floor(p / pitch) + 0.5) * pitch;
    float l = luma(tex(cell / uPlane));
    float r = 0.5 * pitch * sqrt(1.0 - l) * 1.05;
    float d = smoothstep(r + 0.7, r - 0.7, length(p - cell));
    vec3 paper = mix(uBone, uBone * 0.92, hash(floor(p)) * 0.5);
    vec3 stampC = mix(paper, uInk, d);
    float m = clamp(hoverMask, 0.0, 1.0);
    outColor = vec4(mix(stampC, col, m), uAlpha);
    return;
  }

  if (uVariant > 0.5) {
    outColor = vec4(col, uAlpha);
    return;
  }

  // blueprint
  vec2 tx = 1.0 / max(uPlane * uDpr, vec2(1.0));
  float tl = luma(tex(vUv + vec2(-tx.x,  tx.y)));
  float  t = luma(tex(vUv + vec2( 0.0,   tx.y)));
  float tr = luma(tex(vUv + vec2( tx.x,  tx.y)));
  float  l = luma(tex(vUv + vec2(-tx.x,  0.0)));
  float  r = luma(tex(vUv + vec2( tx.x,  0.0)));
  float bl = luma(tex(vUv + vec2(-tx.x, -tx.y)));
  float  b = luma(tex(vUv + vec2( 0.0,  -tx.y)));
  float br = luma(tex(vUv + vec2( tx.x, -tx.y)));
  float gx = -tl - 2.0 * l - bl + tr + 2.0 * r + br;
  float gy = -tl - 2.0 * t - tr + bl + 2.0 * b + br;
  float edge = smoothstep(0.12, 0.45, length(vec2(gx, gy)));

  float pitch = 7.0;
  vec2 cell = (floor(p / pitch) + 0.5) * pitch;
  float lc = luma(tex(cell / uPlane));
  float rad = 0.5 * pitch * sqrt(lc) * 0.95;
  float dotm = smoothstep(rad + 0.7, rad - 0.7, length(p - cell));

  vec2 g = abs(fract(p / 28.0 + 0.5) - 0.5) * 28.0;
  float grid = 1.0 - smoothstep(0.0, 1.2, min(g.x, g.y));

  vec3 bp = uInk * 1.6 + 0.012;
  bp = mix(bp, uBone * 0.5, dotm * 0.6);
  bp = mix(bp, uBone * 0.22, grid * 0.5);
  bp = mix(bp, uBone, edge * 0.85);

  // top-down sweep: rows above the line are rendered
  float y = 1.0 - vUv.y;
  float sweep = uProgress * 1.15 - 0.075;
  float revealed = 1.0 - smoothstep(sweep - 0.06, sweep, y);
  float m = clamp(max(revealed, hoverMask), 0.0, 1.0);
  vec3 c = mix(bp, col, m);

  float band = (1.0 - smoothstep(0.0, 0.012, abs(y - sweep))) * step(0.001, uProgress) * (1.0 - step(0.999, uProgress));
  c = mix(c, uSignal, band * 0.9);
  // faint scanlines on the rendered area
  c *= 1.0 - 0.06 * m * step(0.5, fract(gl_FragCoord.y / (2.0 * uDpr)));
  outColor = vec4(c, uAlpha);
}`;

/** Full-screen triangle for the ink simulation pass. */
export const simVert = /* glsl */ `#version 300 es
in vec2 position;
in vec2 uv;
out vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }`;

/** Ink trail: diffusion + decay + capsule splat (prev→current pointer) + scroll advection. */
export const simFrag = /* glsl */ `#version 300 es
precision highp float;
uniform sampler2D tPrev;
uniform vec2 uTexel;
uniform vec2 uP0;
uniform vec2 uP1;
uniform float uForce;
uniform float uRadius;
uniform float uDecay;
uniform float uAspect;
uniform float uAdvect;
in vec2 vUv;
out vec4 outColor;
float seg(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  return length(pa - ba * h);
}
void main() {
  vec2 uv = vUv + vec2(0.0, uAdvect);
  float c = texture(tPrev, uv).r;
  float n = texture(tPrev, uv + vec2(uTexel.x, 0.0)).r + texture(tPrev, uv - vec2(uTexel.x, 0.0)).r
          + texture(tPrev, uv + vec2(0.0, uTexel.y)).r + texture(tPrev, uv - vec2(0.0, uTexel.y)).r;
  float v = mix(c, n * 0.25, 0.42);
  vec2 asp = vec2(uAspect, 1.0);
  float d = seg(vUv * asp, uP0 * asp, uP1 * asp);
  v += uForce * (1.0 - smoothstep(0.0, uRadius, d));
  v = max(v * uDecay - 1.5 / 255.0, 0.0);
  outColor = vec4(min(v, 1.6), 0.0, 0.0, 1.0);
}`;

/** Hero composite: halftone of the text mask; ink resolves dots into solid signal type; ripples; dithered print-in. */
export const inkFrag = /* glsl */ `#version 300 es
precision highp float;
${common}
uniform sampler2D tMask;
uniform sampler2D tTrail;
uniform vec2 uPlane;      // CSS px
uniform float uDpr;
uniform float uPitch;
uniform float uReveal;
uniform float uTime;
uniform vec3 uDot;
uniform vec3 uSignal;
uniform vec4 uRipples[3]; // x, y (uv), radius (css px), strength
in vec2 vUv;
out vec4 outColor;
void main() {
  vec2 p = vUv * uPlane;
  vec2 cell = (floor(p / uPitch) + 0.5) * uPitch;
  float lod = log2(max(uPitch * uDpr, 1.0));
  float cov = textureLod(tMask, cell / uPlane, lod).a;
  float ink = texture(tTrail, vUv).r;
  float k = smoothstep(0.08, 0.55, ink);

  float rip = 0.0;
  for (int i = 0; i < 3; i++) {
    vec4 R = uRipples[i];
    float d = distance(p, R.xy * uPlane);
    rip += R.w * (1.0 - smoothstep(0.0, 26.0, abs(d - R.z)));
  }
  rip = clamp(rip, 0.0, 1.0);

  float breathe = 0.04 * sin(uTime * 1.3 + p.x * 0.012 + p.y * 0.009);
  float r = 0.5 * uPitch * (sqrt(cov) * (0.92 + breathe) + rip * 0.35 * step(0.02, cov));
  float dotA = 1.0 - smoothstep(r - 0.7, r + 0.7, length(p - cell));
  float solid = texture(tMask, vUv).a;
  float a = mix(dotA, solid, k);
  vec3 col = mix(uDot, uSignal, clamp(k + rip * 0.7, 0.0, 1.0));

  float b = bayer8(gl_FragCoord.xy / max(uDpr, 1.0));
  a *= step(b, uReveal * 1.001 - 0.0001 + step(0.999, uReveal));
  outColor = vec4(col, a);
}`;

/**
 * /work field backdrop, pass 1 — one texel per dither cell: density from a base
 * level, a tilt and drifting noise that travels with the field (30% parallax),
 * stepped back while a card is held, and torn open where the cursor has just
 * been (the trail sim, roughened by noise). R = density, G = torn-edge rim.
 */
export const backdropFieldFrag = /* glsl */ `#version 300 es
precision highp float;
${common}
uniform sampler2D tTrail;
uniform vec2 uView;     // viewport, css px
uniform vec2 uSize;     // this target, in cells
uniform float uCell;    // css px per cell
uniform vec2 uPan;      // camera, css px
uniform float uTime;
uniform float uMove;
uniform float uDim;
in vec2 vUv;
out vec4 outColor;

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * vnoise(p);
    p = p * 2.03 + 17.17;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 q = floor(vec2(vUv.x, 1.0 - vUv.y) * uSize);   // cell index, top-left origin
  vec2 c = (q + 0.5) * uCell;
  vec2 uv = c / uView;
  float t = uTime;

  float d = 0.34 + (uv.y - 0.5) * 0.3;
  d += (fbm((c + uPan * 0.3) * 0.0021 + vec2(t * 0.017, -t * 0.011)) - 0.5) * 1.05;
  d += uMove * 0.1;

  float tr = texture(tTrail, vec2(uv.x, 1.0 - uv.y)).r;
  float f = tr + (fbm(c * 0.03 + vec2(t * 0.4, -t * 0.27)) - 0.5) * 0.6;
  float hole = smoothstep(0.26, 0.32, f);
  float rim = smoothstep(0.1, 0.18, f) * (1.0 - hole);
  d = clamp(d, 0.0, 1.0) * (1.0 - hole) * (1.0 - uDim * 0.6);
  outColor = vec4(d, rim, 0.0, 1.0);
}`;

/** /work field backdrop, pass 2 — full resolution: ordered dither of the cell density into small square dots. */
export const backdropFrag = /* glsl */ `#version 300 es
precision highp float;
${common}
uniform sampler2D tField;
uniform vec2 uSize;
uniform float uCell;
uniform vec2 uRes;      // drawing buffer px
uniform float uDpr;
uniform float uAlpha;
uniform vec3 uBg;
uniform vec3 uFg;
in vec2 vUv;
out vec4 outColor;
void main() {
  vec2 css = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uDpr;
  vec2 q = floor(css / uCell);
  vec4 f = texture(tField, vec2(q.x + 0.5, uSize.y - q.y - 0.5) / uSize);
  float on = step(bayer8(q), f.r);
  vec2 inCell = abs(css - (q + 0.5) * uCell);
  on *= step(max(inCell.x, inCell.y), uCell * 0.36);
  vec3 ink = mix(uBg, uFg, 0.085 + f.g * 0.2);
  outColor = vec4(mix(uBg, ink, on), uAlpha);
}`;
