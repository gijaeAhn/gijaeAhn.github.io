// The floating island under the tree and the flower. One shape, rendered two ways that fade into each
// other. On the tree's side it is a smooth, continuous surface (marching cubes over a signed-distance
// field). Toward the flower the same shape is sampled into voxels whose size grows continuously with
// distance from the smooth part: grains about a pixel wide where they meet the smooth surface, up to the
// flower's own voxel size under the flower. An adaptive octree makes each region only as fine as its
// position asks for, and noise in the wanted size interleaves the octree's power-of-two steps, so the
// change reads as a gradient rather than as bands.
import * as THREE from "three";
import { MarchingCubes } from "three/addons/objects/MarchingCubes.js";

const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// cheap deterministic value noise
const hash = (x, y) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
function noise(x, y) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy);
  const b = hash(ix + 1, iy);
  const c = hash(ix, iy + 1);
  const d = hash(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

// The island: an oval top, gently domed under the tree, and a rocky underside that tapers to a point.
// Everything that depends only on (x, z) is computed per column; sdf(y) = min(top - y, y + depth, side),
// positive inside.
const SIZE = { rx: 3.2, rz: 1.8, depth: 2.3 };
function islandColumn(x, z, out = {}) {
  const wobble = 1 + (noise(x * 0.9 + 3, z * 0.9 - 1) - 0.5) * 0.18;
  const r = Math.hypot(x / (SIZE.rx * wobble), z / (SIZE.rz * wobble));
  out.top = 0.16 * Math.exp(-((x + 1.4) ** 2 + z ** 2) / 1.8) + (noise(x * 1.3, z * 1.3) - 0.5) * 0.05;
  out.depth = SIZE.depth * Math.pow(Math.max(0, 1 - r * r), 0.85) * (0.8 + 0.4 * noise(x * 1.7 + 9, z * 1.7));
  out.side = (1 - r) * 1.6;
  return out;
}
const columnSdf = (col, y) => Math.min(col.top - y, y + col.depth, col.side);

// Where the voxels begin: a ragged boundary, so the two renderings interleave instead of meeting at a plane.
const SEAM = -0.8;
const seamAt = (y, z) => SEAM + (noise(y * 2.3 + 5, z * 2.3) - 0.5) * 0.5;
// How discrete the island is at a point, 0 (at the seam) .. 1 (under the flower). The noise is what lets
// neighbouring octree levels mix along their borders.
const RAMP = 2.3;
const discreteness = (x, y, z) => smoothstep(0, RAMP, x - seamAt(y, z) + (noise(z * 2.9 + x * 0.8, y * 2.9 - 7) - 0.5) * 0.7);

// colours (the voxel flower uses the same greens)
const GRASS = ["#6e9c5c", "#5e8f55", "#7aa564", "#669a58"].map((c) => new THREE.Color(c));
const grassColor = new THREE.Color("#6a9a5a");
const soilColor = new THREE.Color("#7b654f");
const rockColor = new THREE.Color("#6a6560");

// One colour rule for both renderings: earth by depth, grass where the surface faces up near the top.
// The smooth side evaluates it per vertex; each voxel evaluates it once, so the discrete side is a
// quantized copy of the continuous one. `up` is how much the surface faces up (0..1).
function surfaceColor(x, y, z, up, out) {
  out.copy(rockColor).lerp(soilColor, smoothstep(-1.9, -0.45, y));
  // faint wavy strata: the voxels quantize them too, which carries the layers across the change
  out.multiplyScalar(0.95 + 0.1 * noise(x * 4, z * 4 + y * 3) + 0.05 * Math.sin(y * 21 + noise(x * 1.4, z * 1.4) * 5));
  return out.lerp(grassColor, up * smoothstep(-0.32, -0.1, y));
}

/** Give the page a turn (input, paint) in the middle of long work. */
export const yieldToMain = () => (globalThis.scheduler?.yield ? globalThis.scheduler.yield() : new Promise((resolve) => setTimeout(resolve, 0)));

/**
 * Builds in slices of a few milliseconds, yielding in between, so the page stays responsive.
 * @param {object} o
 * @param {number} o.voxel       the coarsest voxel size (= the flower's voxel size)
 * @param {number} o.levels      octree levels below the coarsest size (finest = voxel / 2^levels)
 * @param {number} o.resolution  marching-cubes grid of the smooth half
 */
export async function buildIsland({ voxel = 0.21, levels = 3, resolution = 64 } = {}) {
  const group = new THREE.Group();
  const disposables = [];
  const c = new THREE.Color();
  let deadline = performance.now() + 8;
  const breathe = async () => {
    if (performance.now() < deadline) return;
    await yieldToMain();
    deadline = performance.now() + 8;
  };

  const columns = new Map();
  const sdf = (x, y, z) => {
    const key = (Math.round(x * 2048) + 16384) * 65536 + Math.round(z * 2048) + 16384;
    let column = columns.get(key);
    if (!column) columns.set(key, (column = islandColumn(x, z)));
    return columnSdf(column, y);
  };
  // Surface normal from the sdf itself, shared by both renderings, so the smooth skin and the voxels
  // beside it shade alike (the marching-cubes normals would bend where the skin is cut at the seam).
  const NORMAL_STEP = 0.04;
  const normalAt = (x, y, z, out, e = NORMAL_STEP) =>
    out.set(sdf(x - e, y, z) - sdf(x + e, y, z), sdf(x, y - e, z) - sdf(x, y + e, z), sdf(x, y, z - e) - sdf(x, y, z + e)).normalize();

  // ------------------------------------------------------------ smooth side (continuous)
  // Marching cubes over the same sdf, closed a little past the ragged seam, under the finest voxels.
  const res = resolution;
  const box = {
    min: new THREE.Vector3(-SIZE.rx * 1.12 - 0.2, -SIZE.depth * 1.25 - 0.25, -SIZE.rz * 1.12 - 0.2),
    max: new THREE.Vector3(SEAM + 0.6, 0.5, SIZE.rz * 1.12 + 0.2),
  };
  const span = box.max.clone().sub(box.min);
  const mc = new MarchingCubes(res, new THREE.MeshBasicMaterial(), false, false, 90000);
  mc.isolation = 80;
  const col = {};
  // sample on the lattice MarchingCubes emits: grid point i sits at i / res of the box
  for (let k = 0; k < res; k++) {
    await breathe();
    const z = box.min.z + (k / res) * span.z;
    for (let i = 0; i < res; i++) {
      const x = box.min.x + (i / res) * span.x;
      islandColumn(x, z, col);
      for (let j = 0; j < res; j++) {
        const y = box.min.y + (j / res) * span.y;
        // near the seam the smooth skin sinks just under the finest voxels, so its closing edge stays hidden
        const seam = seamAt(y, z);
        const d = Math.min(columnSdf(col, y) - 0.008 * smoothstep(seam - 0.25, seam, x), seam + 0.03 - x);
        mc.field[i + res * j + res * res * k] = 80 + 260 * d;
      }
    }
  }
  mc.update();
  const count = mc.count;
  const pos = new Float32Array(count * 3);
  const nor = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const n = new THREE.Vector3();
  // the triangles come unindexed, so each vertex appears about six times: shade it once
  const shaded = new Map();
  for (let v = 0; v < count; v++) {
    if ((v & 1023) === 0) await breathe();
    const mx = mc.positionArray[v * 3];
    const my = mc.positionArray[v * 3 + 1];
    const mz = mc.positionArray[v * 3 + 2];
    // marching cubes output lives in [-1, 1]^3
    const x = box.min.x + ((mx + 1) / 2) * span.x;
    const y = box.min.y + ((my + 1) / 2) * span.y;
    const z = box.min.z + ((mz + 1) / 2) * span.z;
    pos.set([x, y, z], v * 3);
    const key = (Math.round((mx + 1) * 65536) * 131072 + Math.round((my + 1) * 65536)) * 131072 + Math.round((mz + 1) * 65536);
    let shade = shaded.get(key);
    if (!shade) {
      normalAt(x, y, z, n);
      surfaceColor(x, y, z, smoothstep(0.35, 0.75, n.y), c);
      shaded.set(key, (shade = new Float32Array([n.x, n.y, n.z, c.r, c.g, c.b])));
    }
    nor.set(shade.subarray(0, 3), v * 3);
    colors.set(shade.subarray(3), v * 3);
  }
  const smoothGeometry = new THREE.BufferGeometry();
  smoothGeometry.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  smoothGeometry.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
  smoothGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  smoothGeometry.computeBoundingSphere();
  mc.geometry.dispose();
  mc.material.dispose();
  const smoothMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0 });
  const smooth = new THREE.Mesh(smoothGeometry, smoothMaterial);
  smooth.castShadow = smooth.receiveShadow = true;
  group.add(smooth);
  disposables.push(smoothGeometry, smoothMaterial);

  // ------------------------------------------------------------ voxel side (discretized)
  const S = voxel;
  const finest = S / 2 ** levels;
  // the voxel size each point asks for: finest at the seam, S under the flower, on a log scale
  const wanted = (x, y, z) => finest * 2 ** (levels * discreteness(x, y, z));

  // Octree cells are cubes of size S / 2^level. The roots sit on a grid with a face at y = 0 (the flat
  // top under the flower) and a column centred on z = 0. A cell splits while it is larger than the size
  // its centre asks for, but only where the surface passes through it: elsewhere it is uniform anyway.
  // (The sdf is not a true distance near the steep underside, so crossings are found by sign changes.)
  const crosses = (x, y, z, h) => {
    const inside = sdf(x, y, z) > 0;
    const q = h / 2;
    for (const dx of [-q, q]) for (const dy of [-q, q]) for (const dz of [-q, q]) if (sdf(x + dx, y + dy, z + dz) > 0 !== inside) return true;
    return Math.abs(sdf(x, y, z)) < h * 0.5;
  };
  const splits = new Map();
  function split(x, y, z, h) {
    if (h < finest * 1.5) return false;
    const unit = finest / 2;
    const key = ((Math.round(x / unit) + 1024) * 2048 + Math.round(y / unit) + 1024) * 2048 + Math.round(z / unit) + 1024;
    let s = splits.get(key);
    if (s === undefined) {
      s = h > wanted(x, y, z) * Math.SQRT2 && crosses(x, y, z, h);
      splits.set(key, s);
    }
    return s;
  }
  // is the leaf cell that contains point p filled? (cells on the smooth side count by the same rule,
  // since the smooth surface covers them)
  function filledAt(px, py, pz) {
    let h = S;
    let x = (Math.floor(px / S) + 0.5) * S;
    let y = (Math.floor(py / S) + 0.5) * S;
    let z = Math.round(pz / S) * S;
    while (split(x, y, z, h)) {
      h /= 2;
      x += px < x ? -h / 2 : h / 2;
      y += py < y ? -h / 2 : h / 2;
      z += pz < z ? -h / 2 : h / 2;
    }
    return sdf(x, y, z) > 0;
  }
  // A filled leaf is drawn only if one of its faces touches an empty leaf. The octree is not 2:1
  // balanced (a cell splits only where the surface crosses it), so the leaves across a face can be any
  // number of levels finer: take the same-size cell across the face (or the coarser leaf holding it) and
  // walk its children on the near side down to leaves.
  function faceOpen(x, y, z, h, axis, sign) {
    if (!split(x, y, z, h)) return sdf(x, y, z) <= 0;
    const q = h / 4;
    const a = (axis + 1) % 3;
    const b = (axis + 2) % 3;
    for (const oa of [-q, q]) {
      for (const ob of [-q, q]) {
        const child = [x, y, z];
        child[axis] -= sign * q;
        child[a] += oa;
        child[b] += ob;
        if (faceOpen(child[0], child[1], child[2], h / 2, axis, sign)) return true;
      }
    }
    return false;
  }
  function exposed(x, y, z, h) {
    for (let axis = 0; axis < 3; axis++) {
      for (const sign of [-1, 1]) {
        const p = [x, y, z];
        p[axis] += sign * (h / 2 + finest / 4);
        let hh = S;
        let cx = (Math.floor(p[0] / S) + 0.5) * S;
        let cy = (Math.floor(p[1] / S) + 0.5) * S;
        let cz = Math.round(p[2] / S) * S;
        while (hh > h * 1.5 && split(cx, cy, cz, hh)) {
          hh /= 2;
          cx += p[0] < cx ? -hh / 2 : hh / 2;
          cy += p[1] < cy ? -hh / 2 : hh / 2;
          cz += p[2] < cz ? -hh / 2 : hh / 2;
        }
        if (hh > h * 1.5 ? sdf(cx, cy, cz) <= 0 : faceOpen(cx, cy, cz, hh, axis, sign)) return true;
      }
    }
    return false;
  }

  const voxels = [];
  function visit(x, y, z, h) {
    if (split(x, y, z, h)) {
      const q = h / 4;
      for (const dx of [-q, q]) for (const dy of [-q, q]) for (const dz of [-q, q]) visit(x + dx, y + dy, z + dz, h / 2);
      return;
    }
    if (sdf(x, y, z) <= 0) return; // empty
    if (x < seamAt(y, z)) return; // the smooth surface is drawn here
    if (exposed(x, y, z, h)) voxels.push({ x, y, z, h });
  }
  for (let ix = Math.floor((SEAM - 0.4) / S); ix * S < SIZE.rx * 1.12; ix++) {
    await breathe();
    for (let iz = -Math.ceil((SIZE.rz * 1.12) / S); iz * S < SIZE.rz * 1.12 + S; iz++) {
      for (let iy = Math.floor((-SIZE.depth * 1.25) / S) - 1; iy <= 1; iy++) visit((ix + 0.5) * S, (iy + 0.5) * S, iz * S, S);
    }
  }

  // Shading follows the same continuum: each voxel carries the smooth surface's normal, and its faces
  // light up with a mix of that normal and their own flat one. The finest grains shade exactly like the
  // smooth surface beside them; the further from the seam, the more each block shows its own faces.
  const voxelCube = new THREE.BoxGeometry(1, 1, 1);
  const surface = new Float32Array(voxels.length * 4); // smooth normal (xyz) and how flat to shade (w)
  voxelCube.setAttribute("surface", new THREE.InstancedBufferAttribute(surface, 4));
  const voxelMaterial = new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0 });
  voxelMaterial.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nattribute vec4 surface;")
      .replace(
        "#include <beginnormal_vertex>",
        "#include <beginnormal_vertex>\nobjectNormal = normalize(mix(surface.xyz, objectNormal, surface.w));"
      );
  };
  const voxelMesh = new THREE.InstancedMesh(voxelCube, voxelMaterial, voxels.length);
  voxelMesh.castShadow = voxelMesh.receiveShadow = true;
  const grad = new THREE.Vector3();
  for (let i = 0; i < voxels.length; i++) {
    if ((i & 1023) === 0) await breathe();
    const v = voxels[i];
    const { x, y, z, h } = v;
    const t = discreteness(x, y, z); // continuous, 0..1
    const level = Math.log2(h / finest) / levels; // stepped, 0..1
    // facing up: from the surface normal where the voxels are fine, from "is my top face open" where
    // they are coarse (a block's whole top is grass, as it should be in a voxel world)
    normalAt(x, y, z, grad, Math.max(h / 2, NORMAL_STEP));
    const open = filledAt(x, y + h / 2 + finest / 4, z) ? 0 : 1;
    const up = THREE.MathUtils.lerp(smoothstep(0.35, 0.75, grad.y), open, level);
    surfaceColor(x, y, z, up, c);
    // each block takes its own shade, the more so the more discrete it is
    const r = hash(x * 13.1 + y * 3.3, z * 7.7);
    if (up > 0.5) c.lerp(GRASS[Math.floor(r * GRASS.length)], 0.7 * t);
    c.multiplyScalar(1 + (hash(z * 5.3, x * 9.1 + y) - 0.5) * 0.14 * t);
    voxelMesh.setColorAt(i, c);
    surface.set([grad.x, grad.y, grad.z, smoothstep(0.02, 0.7, t)], i * 4);
    v.scale = h * (1 - 0.08 * level); // fine grains sit flush, coarse blocks show their seams
    v.home = new THREE.Vector3(x, y, z);
    v.out = new THREE.Vector3(x - SEAM, y + 0.6, z).normalize();
    v.weight = t ** 1.5; // in the exploded view, the more discrete it is, the further it drifts
  }
  voxelMesh.instanceColor.needsUpdate = true;
  group.add(voxelMesh);
  const cube = new THREE.BoxGeometry(1, 1, 1);
  disposables.push(voxelCube, voxelMaterial, cube);

  // ------------------------------------------------------------ drifting bits under the island
  // Smooth pebbles under the tree, cubes of growing size toward the flower: the same continuum in small.
  // Everything drifts slowly and smoothly.
  const pebbleGeometry = new THREE.IcosahedronGeometry(1, 3);
  const pebbleMaterial = new THREE.MeshStandardMaterial({ color: "#827a72", roughness: 0.85, metalness: 0 });
  const pebbles = [
    { p: [-2.1, -2.5, 0.3], r: 0.15, phase: 0 },
    { p: [-1.3, -2.9, -0.35], r: 0.09, phase: 2.1 },
    { p: [-2.6, -1.9, -0.6], r: 0.07, phase: 4.2 },
  ].map((b) => {
    const m = new THREE.Mesh(pebbleGeometry, pebbleMaterial);
    m.scale.setScalar(b.r);
    m.position.set(...b.p);
    m.castShadow = true;
    group.add(m);
    return { mesh: m, ...b };
  });
  const bitColors = ["#77706a", "#6b5a4a", "#827a72", "#7b654f", "#6a6560"];
  const bits = [
    [0.2, -2.75, 0.25, S / 4],
    [1.0, -2.5, -0.4, S / 2],
    [1.7, -2.05, 0.45, S / 2],
    [2.4, -1.6, -0.2, S],
    [1.4, -3.05, -0.1, S / 4],
  ].map(([x, y, z, s], i) => {
    const material = new THREE.MeshStandardMaterial({ color: bitColors[i], roughness: 0.78, metalness: 0, flatShading: true });
    const m = new THREE.Mesh(cube, material);
    m.scale.setScalar(s * 0.92);
    m.position.set(x, y, z);
    m.castShadow = true;
    group.add(m);
    disposables.push(material);
    return { mesh: m, y, s, phase: i * 1.7 };
  });
  disposables.push(pebbleGeometry, pebbleMaterial);

  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const at = new THREE.Vector3();
  function placeVoxels(spread) {
    voxels.forEach((v, i) => {
      at.copy(v.home).addScaledVector(v.out, spread * v.weight * 1.4);
      m4.compose(at, q, scale.setScalar(v.scale));
      voxelMesh.setMatrixAt(i, m4);
    });
    voxelMesh.instanceMatrix.needsUpdate = true;
  }
  placeVoxels(0);
  let lastSpread = 0;
  columns.clear();
  splits.clear();

  return {
    group,
    stats: { voxels: voxels.length, triangles: count / 3 },
    /** the centre of the coarsest voxel column nearest to (x, z): where the flower can stand on y = 0 */
    snap(x, z) {
      return { x: (Math.floor(x / S) + 0.5) * S, z: Math.round(z / S) * S };
    },
    /** top surface height of the island at (x, z), for planting the tree */
    topAt(x, z) {
      const column = islandColumn(x, z);
      let y = 0.4;
      while (y > -0.5 && columnSdf(column, y) < 0) y -= 0.005;
      return y;
    },
    /** The pebbles and cubes bob gently under the island. */
    update(t, spread) {
      for (const b of pebbles) b.mesh.position.y = b.p[1] + Math.sin(t * 0.8 + b.phase) * 0.08;
      for (const b of bits) b.mesh.position.y = b.y + Math.sin(t * 0.7 + b.phase) * 0.07;
      if (spread !== lastSpread) {
        placeVoxels(spread);
        lastSpread = spread;
      }
    },
    dispose() {
      for (const d of disposables) d.dispose();
      voxelMesh.dispose();
    },
  };
}
