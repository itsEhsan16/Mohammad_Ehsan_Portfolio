/**
 * The home scene's ground and camera framing. Pure maths with no DOM or WebGL,
 * so three places share it:
 *   - the WebGL mesh (lib/gl/scene.ts);
 *   - where the figure's feet go;
 *   - the server-drawn ridge used before WebGL starts and on phones.
 * Units are metres. y is up, and the figure stands at the origin facing +z,
 * toward the camera.
 */

/** Framing of the figure on the stage, shared by the scene and the fallback. */
export const STAGE = {
  /** figure height after normalising (m) */
  figureHeight: 1.8,
  /** vertical field of view (degrees) */
  fov: 30,
  /** figure height as a share of the stage height */
  fill: 0.6,
  /** the feet sit this far down the stage (0 = top, 1 = bottom) */
  feetAt: 0.85,
  /** the camera orbits a point this far above the feet (m) */
  pivot: 0.95,
  /** camera elevation around the pivot (degrees; negative = below it, looking up) */
  elevation: -3,
  /** the fallback's reference aspect ratio (width / height) */
  aspect: 1.6,
};

/** Camera distance at which the figure fills `STAGE.fill` of the stage height. */
export const baseDistance = () =>
  STAGE.figureHeight / (STAGE.fill * 2 * Math.tan(((STAGE.fov / 2) * Math.PI) / 180));

// --- noise (integer hash, so every platform builds the same ground) ---
function hash2(ix: number, iz: number) {
  let h = (Math.imul(ix | 0, 374761393) + Math.imul(iz | 0, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function vnoise(x: number, z: number) {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx);
  const uz = fz * fz * (3 - 2 * fz);
  const a = hash2(ix, iz);
  const b = hash2(ix + 1, iz);
  const c = hash2(ix, iz + 1);
  const d = hash2(ix + 1, iz + 1);
  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
}

/** Fractal noise in about −1..1. */
function fbm(x: number, z: number, octaves = 5) {
  let sum = 0;
  let amp = 0.5;
  let f = 1;
  for (let i = 0; i < octaves; i++) {
    sum += amp * (vnoise(x * f + i * 17.17, z * f - i * 9.31) * 2 - 1);
    f *= 2.03;
    amp *= 0.5;
  }
  return sum;
}

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Ground height without the flat pad under the feet. */
function rawHeight(x: number, z: number) {
  // the crest the figure stands on runs left–right through the origin and wanders a little
  const crestZ = 0.7 * fbm(x * 0.07 + 3.1, 0.7, 3);
  const dz = z - crestZ;
  const crest = 0.95 * Math.exp(-(dz * dz) / (2 * 2.4 * 2.4)) * (0.8 + 0.5 * fbm(x * 0.11, 5.3, 3));
  // rolling ground everywhere
  const roll = 0.32 * fbm(x * 0.16 + 11, z * 0.16 - 4, 4);
  // a ring of hills around the stage (so orbiting never runs out of horizon);
  // ridged noise gives sharp peaks and saddles
  const back = Math.max(0, Math.hypot(x, z) - 12);
  const ridged = 1 - Math.abs(fbm(x * 0.075 + 7, z * 0.05 - 2, 4));
  const peaks = Math.pow(ridged, 2.6) * (0.5 + 1.0 * (0.5 + 0.5 * fbm(x * 0.015 - 3, 1.7, 2)));
  const range = (1 - Math.exp(-back / 16)) * (0.4 + 9.5 * peaks);
  // fine drift detail
  const fine = 0.05 * fbm(x * 1.6, z * 1.6, 3);
  return crest + roll + range + fine;
}

let padHeight: number | null = null;

/** Height of the ground under the figure's feet. */
export function feetHeight() {
  if (padHeight === null) padHeight = rawHeight(0, 0);
  return padHeight;
}

/** Ground height at (x, z), flattened into a small pad under the feet. */
export function heightAt(x: number, z: number) {
  const h = rawHeight(x, z);
  const k = smoothstep(0.95, 0.4, Math.hypot(x, z));
  return h + (feetHeight() - h) * k;
}

export interface CameraPose {
  /** camera position */
  eye: [number, number, number];
  /** the point it looks at */
  target: [number, number, number];
}

/**
 * Camera on an orbit around the pivot above the feet. `azimuth` and
 * `elevation` are in degrees, `distance` in metres. The camera never dips
 * below the ground.
 */
export function cameraPose(azimuth = 0, elevation = STAGE.elevation, distance = baseDistance()): CameraPose {
  const a = (azimuth * Math.PI) / 180;
  const e = (elevation * Math.PI) / 180;
  const ty = feetHeight() + STAGE.pivot;
  const x = Math.sin(a) * Math.cos(e) * distance;
  const z = Math.cos(a) * Math.cos(e) * distance;
  let y = ty + Math.sin(e) * distance;
  y = Math.max(y, heightAt(x, z) + 0.25);
  return { eye: [x, y, z], target: [0, ty, 0] };
}

type V3 = [number, number, number];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

/** Camera basis: right, up and forward unit vectors. */
export function cameraBasis(pose: CameraPose) {
  const f = norm(sub(pose.target, pose.eye));
  const r = norm(cross(f, [0, 1, 0]));
  const u = cross(r, f);
  return { r, u, f };
}

/**
 * Vertical offset (in normalised device units) that puts the feet at
 * `STAGE.feetAt` of the stage height. The scene adds it to the projection
 * (an off-axis shift); the fallback uses it to match.
 */
export function feetShift(pose: CameraPose) {
  const { u, f } = cameraBasis(pose);
  const feet: V3 = [0, feetHeight(), 0];
  const d = sub(feet, pose.eye);
  const t = Math.tan(((STAGE.fov / 2) * Math.PI) / 180);
  const ndc = dot(d, u) / (dot(d, f) * t);
  return 1 - 2 * STAGE.feetAt - ndc;
}

/**
 * The skyline as seen from the default camera: for `columns` points across
 * the stage, how far down (0 = top, 1 = bottom) the ground starts. Used by the
 * server-drawn fallback so it matches the live scene.
 */
export function stageSkyline(columns = 96, aspect = STAGE.aspect) {
  const pose = cameraPose();
  const { r, u, f } = cameraBasis(pose);
  const shift = feetShift(pose);
  const t = Math.tan(((STAGE.fov / 2) * Math.PI) / 180);
  // horizontal forward and right, for marching along the ground
  const fh = norm([f[0], 0, f[2]]);
  const rh = norm([r[0], 0, r[2]]);
  const out: number[] = [];
  for (let c = 0; c < columns; c++) {
    const xn = (c / (columns - 1)) * 2 - 1;
    let top = 1;
    for (let s = 0; s < 160; s++) {
      const depth = 0.4 * Math.pow(1.045, s); // 0.4 m … about 450 m
      if (depth > 120) break;
      const side = xn * t * aspect * depth;
      const x = pose.eye[0] + fh[0] * depth + rh[0] * side;
      const z = pose.eye[2] + fh[2] * depth + rh[2] * side;
      const p: V3 = [x, heightAt(x, z), z];
      const d = sub(p, pose.eye);
      const zf = dot(d, f);
      if (zf <= 0.05) continue;
      const yn = dot(d, u) / (zf * t) + shift;
      top = Math.min(top, (1 - yn) / 2);
    }
    out.push(Math.max(0, Math.min(1, top)));
  }
  return out;
}
