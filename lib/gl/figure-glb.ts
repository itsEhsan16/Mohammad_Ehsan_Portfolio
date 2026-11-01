"use client";

import { GLTFLoader, GLTFSkin, Mesh, Transform, type GLTFAnimation, type OGLRenderingContext, type Program, type Texture } from "ogl";

/**
 * Loads your GLB (e.g. from Tripo) into the home scene. This is a separate
 * lazy chunk and the only importer of OGL's glTF loader, so other routes never
 * pay for it.
 *
 * - The file is fetched once per session; the bytes are kept so a lost WebGL
 *   context can rebuild without the network.
 * - Every part gets the scene's dithered figure shader (OGL doesn't render
 *   glTF materials); the base colour factor and texture are kept.
 * - It plays the clip named in me.json, else one called "idle", else the first.
 * - It is scaled to `height` with its feet at y = 0, centred on its feet, and
 *   turned by `yaw`. For rigged models the size comes from skinned sample
 *   points, because glTF stores skinned geometry in bind space.
 */

type GL = OGLRenderingContext & WebGL2RenderingContext;
type ProgramFactory = (
  gl: GL,
  opts: { skinned?: boolean; uv?: boolean; alphaMask?: boolean; base?: [number, number, number, number]; map?: Texture | null; cutoff?: number },
) => Program;

export interface LoadedFigure {
  root: Transform;
  triangles: number;
  clip: string;
  update(t: number, dt: number, look: number): void;
  dispose(): void;
}

interface GltfMaterial {
  baseColorFactor?: number[];
  baseColorTexture?: { texture?: Texture };
  alphaMode?: string;
  alphaCutoff?: number;
}

type Channel = { node: unknown; transform?: string; times: ArrayLike<number> };
type Anim = GLTFAnimation & { data: Channel[] };

const bytes = new Map<string, ArrayBuffer>();
const DEG = Math.PI / 180;

async function fetchBytes(src: string) {
  const hit = bytes.get(src);
  if (hit) return hit;
  const res = await fetch(src);
  if (!res.ok) throw new Error(`${src}: HTTP ${res.status}`);
  const buf = await res.arrayBuffer();
  bytes.set(src, buf);
  return buf;
}

const timeout = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

/** Bounds of every mesh under `root` in root space (skinned meshes posed on the CPU). */
function bounds(meshes: Mesh[]) {
  const pts: number[] = [];
  const v = [0, 0, 0];
  for (const mesh of meshes) {
    const pos = mesh.geometry.attributes.position;
    if (!pos?.data) continue;
    const p = pos.data as ArrayLike<number>;
    const stride = pos.size || 3;
    const n = Math.floor(p.length / stride);
    const step = Math.max(1, Math.floor(n / 6000));
    if (mesh instanceof GLTFSkin) {
      const si = mesh.geometry.attributes.skinIndex?.data as ArrayLike<number> | undefined;
      const sw = mesh.geometry.attributes.skinWeight?.data as ArrayLike<number> | undefined;
      const joints = mesh.skeleton.joints;
      if (!si || !sw) continue;
      for (let i = 0; i < n; i += step) {
        const x = p[i * stride];
        const y = p[i * stride + 1];
        const z = p[i * stride + 2];
        v[0] = v[1] = v[2] = 0;
        let wsum = 0;
        for (let k = 0; k < 4; k++) {
          const w = sw[i * 4 + k];
          if (!w) continue;
          const j = joints[si[i * 4 + k]];
          if (!j) continue;
          // world × bindInverse, applied to the bind-space point
          const b = j.bindInverse;
          const bx = b[0] * x + b[4] * y + b[8] * z + b[12];
          const by = b[1] * x + b[5] * y + b[9] * z + b[13];
          const bz = b[2] * x + b[6] * y + b[10] * z + b[14];
          const m = j.worldMatrix;
          v[0] += w * (m[0] * bx + m[4] * by + m[8] * bz + m[12]);
          v[1] += w * (m[1] * bx + m[5] * by + m[9] * bz + m[13]);
          v[2] += w * (m[2] * bx + m[6] * by + m[10] * bz + m[14]);
          wsum += w;
        }
        if (wsum > 0) pts.push(v[0] / wsum, v[1] / wsum, v[2] / wsum);
      }
    } else {
      const m = mesh.worldMatrix;
      for (let i = 0; i < n; i += step) {
        const x = p[i * stride];
        const y = p[i * stride + 1];
        const z = p[i * stride + 2];
        pts.push(m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]);
      }
    }
  }
  if (!pts.length) throw new Error("The model has no vertices.");
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 1; i < pts.length; i += 3) {
    minY = Math.min(minY, pts[i]);
    maxY = Math.max(maxY, pts[i]);
  }
  // centre on the feet: the points in the lowest 3% of the height
  const band = minY + (maxY - minY) * 0.03;
  let cx = 0;
  let cz = 0;
  let c = 0;
  for (let i = 0; i < pts.length; i += 3) {
    if (pts[i + 1] > band) continue;
    cx += pts[i];
    cz += pts[i + 2];
    c++;
  }
  return { minY, maxY, cx: c ? cx / c : 0, cz: c ? cz / c : 0 };
}

function pickClip(anims: { name?: string; animation: GLTFAnimation }[] | null | undefined, want: string | null) {
  if (!anims?.length) return null;
  const by = (re: RegExp) => anims.find((a) => a.name && re.test(a.name));
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (want ? by(new RegExp(`^${esc(want)}$`, "i")) : null) ?? by(/idle/i) ?? anims[0];
}

export async function loadFigure(
  gl: GL,
  src: string,
  opts: { yaw: number; height: number; clip: string | null; program: ProgramFactory },
): Promise<LoadedFigure> {
  const buf = await fetchBytes(src);
  const desc = GLTFLoader.unpackGLB(buf);
  const dir = src.split("?")[0].split("/").slice(0, -1).join("/") + "/";
  const gltf = await GLTFLoader.parse(gl, desc, dir);

  // root → sway (turns about the feet) → fit (scale / centre / yaw) → the model
  const root = new Transform();
  const sway = new Transform();
  const fit = new Transform();
  sway.setParent(root);
  fit.setParent(sway);
  const tops = gltf.scene ?? gltf.scenes?.[0] ?? [];
  tops.forEach((n) => n.setParent(fit));

  // our shader on every part; wait (briefly) for textures so it never flashes untextured
  const meshes: Mesh[] = [];
  fit.traverse((n) => {
    if (n instanceof Mesh) meshes.push(n);
  });
  if (!meshes.length) throw new Error("The model has no meshes.");
  const maps = new Set<Texture>();
  let triangles = 0;
  for (const mesh of meshes) {
    const mat = (mesh.program as Program & { gltfMaterial?: GltfMaterial }).gltfMaterial;
    const f = mat?.baseColorFactor ?? [1, 1, 1, 1];
    const map = mat?.baseColorTexture?.texture ?? null;
    const uv = !!mesh.geometry.attributes.uv && !!map;
    if (map) {
      map.minFilter = gl.LINEAR_MIPMAP_LINEAR;
      map.magFilter = gl.LINEAR;
      maps.add(map);
    }
    mesh.program = opts.program(gl, {
      skinned: mesh instanceof GLTFSkin,
      uv,
      alphaMask: mat?.alphaMode === "MASK",
      cutoff: mat?.alphaCutoff ?? 0.5,
      base: [f[0] ?? 1, f[1] ?? 1, f[2] ?? 1, f[3] ?? 1],
      map: uv ? map : null,
    });
    mesh.frustumCulled = false;
    const idx = mesh.geometry.attributes.index;
    triangles += Math.round((idx?.count ?? mesh.geometry.attributes.position?.count ?? 0) / 3);
  }
  const images = (gltf.images ?? []) as (HTMLImageElement & { ready?: Promise<void> })[];
  await Promise.race([Promise.all(images.map((i) => i.ready ?? Promise.resolve())), timeout(8000)]);
  images.forEach((i) => {
    if (i.src?.startsWith("blob:")) URL.revokeObjectURL(i.src);
  });

  // the clip, without channels OGL can't play (morph-target weights)
  const ref = pickClip(gltf.animations, opts.clip);
  const anim = (ref?.animation ?? null) as Anim | null;
  if (anim) {
    anim.data = anim.data.filter((c) => !!c.transform && c.times.length > 1);
    anim.elapsed = 0;
    if (anim.data.length) anim.update();
  }

  // normalise: the first frame's pose, measured in root space
  root.updateMatrixWorld(true);
  const b = bounds(meshes);
  const s = opts.height / Math.max(1e-6, b.maxY - b.minY);
  const yaw = opts.yaw * DEG;
  fit.scale.set(s, s, s);
  fit.rotation.y = yaw;
  // t = −R(yaw)·(s·feet) so the feet land on the origin
  const fx = b.cx * s;
  const fz = b.cz * s;
  fit.position.set(-(fx * Math.cos(yaw) + fz * Math.sin(yaw)), -b.minY * s, -(-fx * Math.sin(yaw) + fz * Math.cos(yaw)));

  const playable = !!anim && anim.data.length > 0;
  let look = 0;
  return {
    root,
    triangles,
    clip: playable ? ref?.name || "Clip 1" : "Idle · procedural",
    update(t, dt, lookTarget) {
      look += (lookTarget - look) * 0.05;
      if (playable) {
        anim!.elapsed += dt;
        anim!.update();
        sway.rotation.y = look * 4 * DEG;
      } else {
        // no clip: a slow sway about the feet, and a turn toward the pointer
        sway.rotation.z = Math.sin((t * Math.PI * 2) / 7.3) * 0.8 * DEG;
        sway.rotation.y = look * 6 * DEG;
      }
    },
    dispose() {
      for (const mesh of meshes) mesh.geometry.remove();
      maps.forEach((m) => m.texture && gl.deleteTexture(m.texture));
    },
  };
}
