import { Geometry, Mesh, Transform, type OGLRenderingContext, type Program } from "ogl";

/**
 * The stand-in figure: a wooden artist's mannequin, 1.8 m tall, built from
 * ellipsoids and capsules on a joint hierarchy. Stands in a relaxed
 * contrapposto pose (weight on its right leg), feet at y = 0, facing +z.
 * `pose(t, look)` breathes, sways and turns the head toward the pointer.
 * About 11k triangles.
 */

type GL = OGLRenderingContext;

function build(gl: GL, pos: number[], nor: number[], idx: number[]) {
  return new Geometry(gl, {
    position: { size: 3, data: new Float32Array(pos) },
    normal: { size: 3, data: new Float32Array(nor) },
    index: { data: new Uint16Array(idx) },
  });
}

/** Ellipsoid centred on the origin. */
function ellipsoid(gl: GL, rx: number, ry: number, rz: number, seg = 24, rings = 12) {
  const pos: number[] = [];
  const nor: number[] = [];
  const idx: number[] = [];
  for (let j = 0; j <= rings; j++) {
    const v = j / rings;
    const phi = v * Math.PI;
    for (let i = 0; i <= seg; i++) {
      const th = (i / seg) * Math.PI * 2;
      const x = Math.sin(phi) * Math.sin(th);
      const y = Math.cos(phi);
      const z = Math.sin(phi) * Math.cos(th);
      pos.push(x * rx, y * ry, z * rz);
      const n = [x / rx, y / ry, z / rz];
      const l = Math.hypot(n[0], n[1], n[2]) || 1;
      nor.push(n[0] / l, n[1] / l, n[2] / l);
    }
  }
  for (let j = 0; j < rings; j++) {
    for (let i = 0; i < seg; i++) {
      const a = j * (seg + 1) + i;
      const b = a + seg + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  return build(gl, pos, nor, idx);
}

/** Capsule hanging down from the origin to y = −len, radius tapering from r0 (top) to r1 (bottom). */
function capsule(gl: GL, r0: number, r1: number, len: number, seg = 18, capRings = 6, bodyRings = 6) {
  const pos: number[] = [];
  const nor: number[] = [];
  const idx: number[] = [];
  const slope = (r0 - r1) / len;
  const rows: { y: number; r: number; ny: number; nr: number }[] = [];
  // top cap (hemisphere)
  for (let j = 0; j <= capRings; j++) {
    const a = (j / capRings) * (Math.PI / 2);
    rows.push({ y: Math.cos(a) * r0, r: Math.sin(a) * r0, ny: Math.cos(a), nr: Math.sin(a) });
  }
  // body (tapered cylinder)
  const nl = Math.hypot(1, slope);
  for (let j = 1; j < bodyRings; j++) {
    const t = j / bodyRings;
    rows.push({ y: -t * len, r: r0 + (r1 - r0) * t, ny: slope / nl, nr: 1 / nl });
  }
  // bottom cap
  for (let j = 0; j <= capRings; j++) {
    const a = Math.PI / 2 + (j / capRings) * (Math.PI / 2);
    rows.push({ y: -len + Math.cos(a) * r1, r: Math.sin(a) * r1, ny: Math.cos(a), nr: Math.sin(a) });
  }
  rows.forEach((row) => {
    for (let i = 0; i <= seg; i++) {
      const th = (i / seg) * Math.PI * 2;
      const s = Math.sin(th);
      const c = Math.cos(th);
      pos.push(s * row.r, row.y, c * row.r);
      nor.push(s * row.nr, row.ny, c * row.nr);
    }
  });
  for (let j = 0; j < rows.length - 1; j++) {
    for (let i = 0; i < seg; i++) {
      const a = j * (seg + 1) + i;
      const b = a + seg + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  return build(gl, pos, nor, idx);
}

const DEG = Math.PI / 180;

export interface Mannequin {
  root: Transform;
  meshes: Mesh[];
  triangles: number;
  /** Idle motion. `t` in seconds; `look` −1..1 turns the head toward the pointer. */
  pose(t: number, look: number): void;
}

export function buildMannequin(gl: GL, wood: Program, joint: Program): Mannequin {
  const root = new Transform();
  const meshes: Mesh[] = [];
  let triangles = 0;
  const part = (geo: Geometry, parent: Transform, program: Program, at: [number, number, number] = [0, 0, 0]) => {
    const m = new Mesh(gl, { geometry: geo, program, frustumCulled: false });
    m.position.set(at[0], at[1], at[2]);
    m.setParent(parent);
    meshes.push(m);
    triangles += (geo.attributes.index?.count ?? 0) / 3;
    return m;
  };
  const node = (parent: Transform, at: [number, number, number], rot: [number, number, number] = [0, 0, 0]) => {
    const t = new Transform();
    t.position.set(at[0], at[1], at[2]);
    t.rotation.set(rot[0] * DEG, rot[1] * DEG, rot[2] * DEG);
    t.setParent(parent);
    return t;
  };
  const ball = (r: number) => ellipsoid(gl, r, r, r, 14, 7);

  // pelvis, tilted for contrapposto: the free (left, +x) hip drops
  const pelvis = node(root, [0.02, 0.97, 0], [0, -4, -4]);
  part(ellipsoid(gl, 0.165, 0.105, 0.11), pelvis, wood);

  // torso: abdomen, then chest counter-tilted against the hips
  const spine = node(pelvis, [0, 0.07, 0], [2, 3, 3]);
  part(ellipsoid(gl, 0.13, 0.11, 0.095), spine, wood, [0, 0.09, 0]);
  const chest = node(spine, [0, 0.2, 0], [-2, 2, 3]);
  part(ellipsoid(gl, 0.185, 0.165, 0.118), chest, wood, [0, 0.1, 0]);
  const neck = node(chest, [0, 0.26, 0.005], [6, 0, -2]);
  part(capsule(gl, 0.043, 0.048, 0.09), neck, wood, [0, 0.1, 0]);
  const head = node(neck, [0, 0.1, 0], [-6, 0, 0]);
  part(ellipsoid(gl, 0.092, 0.118, 0.104), head, wood, [0, 0.115, 0.008]);

  // arms hang relaxed; the right forearm bends a little
  const arm = (side: 1 | -1, bend: number, flare: number) => {
    const shoulder = node(chest, [side * 0.205, 0.175, 0], [2, 0, side * flare]);
    part(ball(0.052), shoulder, joint);
    part(capsule(gl, 0.047, 0.04, 0.27), shoulder, wood, [0, -0.02, 0]);
    const elbow = node(shoulder, [0, -0.295, 0], [-bend, 0, side * 2]);
    part(ball(0.04), elbow, joint);
    part(capsule(gl, 0.039, 0.031, 0.235), elbow, wood, [0, -0.02, 0]);
    const wrist = node(elbow, [0, -0.255, 0], [0, side * 10, 0]);
    part(ellipsoid(gl, 0.03, 0.082, 0.048), wrist, wood, [0, -0.075, 0]);
    return shoulder;
  };
  const armR = arm(-1, 14, 7);
  const armL = arm(1, 8, 9);

  // legs: weight on the right (−x) leg, the left knee eases forward
  const leg = (side: 1 | -1, hipRot: [number, number, number], knee: number, ankle: number) => {
    const hip = node(pelvis, [side * 0.095, -0.045, 0], hipRot);
    part(ball(0.068), hip, joint);
    part(capsule(gl, 0.072, 0.052, 0.4), hip, wood, [0, -0.03, 0]);
    const kn = node(hip, [0, -0.445, 0], [knee, 0, 0]);
    part(ball(0.05), kn, joint);
    part(capsule(gl, 0.05, 0.036, 0.37), kn, wood, [0, -0.02, 0]);
    const an = node(kn, [0, -0.415, 0], [ankle, 0, 0]);
    part(ellipsoid(gl, 0.045, 0.038, 0.115), an, wood, [0, -0.025, 0.05]);
    return hip;
  };
  leg(-1, [0, 4, 1.5], 0, 0);
  leg(1, [-9, -6, -3], 15, -6);

  // bring the lowest point of the feet to y = 0
  root.updateMatrixWorld(true);
  let minY = Infinity;
  for (const m of meshes) {
    const p = m.geometry.attributes.position.data as Float32Array;
    const w = m.worldMatrix;
    for (let i = 0; i < p.length; i += 3) {
      const y = w[1] * p[i] + w[5] * p[i + 1] + w[9] * p[i + 2] + w[13];
      if (y < minY) minY = y;
    }
  }
  root.position.y = -minY;

  const snap = (t: Transform) => ({ x: t.rotation.x, y: t.rotation.y, z: t.rotation.z });
  const base = {
    pelvis: snap(pelvis),
    chest: snap(chest),
    head: snap(head),
    neck: snap(neck),
    armR: snap(armR),
    armL: snap(armL),
  };
  let look = 0;

  return {
    root,
    meshes,
    triangles: Math.round(triangles),
    pose(t: number, lookTarget: number) {
      look += (lookTarget - look) * 0.06;
      const breath = Math.sin((t * Math.PI * 2) / 4.2);
      const sway = Math.sin((t * Math.PI * 2) / 7.3);
      pelvis.rotation.z = base.pelvis.z + sway * 1 * DEG;
      pelvis.rotation.y = base.pelvis.y + sway * 0.8 * DEG;
      chest.rotation.x = base.chest.x - breath * 0.8 * DEG;
      chest.rotation.z = base.chest.z - sway * 0.7 * DEG;
      neck.rotation.y = base.neck.y + look * 6 * DEG;
      head.rotation.y = base.head.y + look * 10 * DEG;
      head.rotation.x = base.head.x + breath * 0.5 * DEG;
      armR.rotation.z = base.armR.z - breath * 0.6 * DEG;
      armL.rotation.z = base.armL.z + breath * 0.6 * DEG;
    },
  };
}
