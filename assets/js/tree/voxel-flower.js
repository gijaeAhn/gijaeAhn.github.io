// A small voxel rose standing on the island's coarsest voxels: the discrete counterpart to the soft
// tree, and a nod to the Little Prince's rose on her tiny planet. Every voxel is one instance of a
// single box, so the whole flower is one draw call.
import * as THREE from "three";

const easeOutCubic = (t) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

// Deterministic PRNG, so the flower is the same on every visit.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const COLORS = {
  grass: ["#5e8f55", "#6e9c5c", "#558549", "#7aa564"],
  stem: ["#3f7d4e", "#468757"],
  leaf: ["#4f9a5c", "#5aa867", "#468f53"],
  thorn: ["#36603d"],
  sepal: ["#3f8a50", "#4a9459"],
  petalDark: ["#a8203a", "#b32642"],
  petal: ["#d23a4e", "#dc4558", "#c93349"],
  petalLight: ["#ec6f7a", "#f2828b"],
};

/**
 * Voxel layout in grid units (y up, stem base at the origin), after the rose in Saint-Exupery's
 * watercolours: a slender stem with a slight lean, two leaves, two thorns, and a half-open bloom whose
 * outer petals curl out toward the viewer. Each entry: [x, y, z, colour group].
 */
export const ROSE = [
  // y = 0: grass tufts and the foot of the stem
  [1, 0, -1, "grass"],
  [0, 0, 0, "stem"],
  [1, 0, 1, "grass"],
  // y = 1: a low leaf to the right, a thorn to the left
  [-1, 1, 0, "thorn"],
  [0, 1, 0, "stem"],
  [1, 1, 0, "leaf"],
  [2, 1, 0, "leaf"],
  [0, 2, 0, "stem"],
  [2, 2, 1, "leaf"],
  [3, 2, 1, "leaf"],
  // y = 3: a higher leaf to the left
  [-2, 3, 0, "leaf"],
  [-1, 3, 0, "leaf"],
  [0, 3, 0, "stem"],
  [1, 3, 0, "stem"], // the bend, so the stem reads as one piece
  // y = 4: the stem has stepped over; a second thorn
  [1, 4, 0, "stem"],
  [2, 4, 0, "thorn"],
  [-3, 4, 1, "leaf"],
  [-2, 4, 1, "leaf"],
  [1, 5, 0, "stem"],
  // y = 6: the green calyx
  [1, 6, -1, "sepal"],
  [0, 6, 0, "sepal"],
  [1, 6, 0, "sepal"],
  [2, 6, 0, "sepal"],
  [1, 6, 1, "sepal"],
  // y = 7: the dark base of the cup
  [1, 7, 0, "petalDark"],
  [2, 7, 0, "petalDark"],
  [1, 7, 1, "petalDark"],
  [2, 7, 1, "petalDark"],
  // y = 8: the outer petals; the front one rolls forward
  [1, 8, -1, "petal"],
  [2, 8, -1, "petal"],
  [0, 8, 0, "petal"],
  [1, 8, 0, "petalDark"],
  [2, 8, 0, "petalDark"],
  [3, 8, 0, "petal"],
  [0, 8, 1, "petal"],
  [1, 8, 1, "petalDark"],
  [2, 8, 1, "petalDark"],
  [3, 8, 1, "petal"],
  [1, 8, 2, "petalLight"],
  [2, 8, 2, "petal"],
  [2, 8, 3, "petalLight"],
  // y = 9: the rim curls outward in light tips; a dark heart
  [1, 9, -1, "petal"],
  [2, 9, -1, "petal"],
  [3, 9, -1, "petalLight"],
  [0, 9, 0, "petal"],
  [1, 9, 0, "petalDark"],
  [2, 9, 0, "petal"],
  [3, 9, 0, "petal"],
  [-1, 9, 1, "petalLight"],
  [0, 9, 1, "petalLight"],
  [1, 9, 1, "petalDark"],
  [2, 9, 1, "petal"],
  [3, 9, 1, "petalLight"],
  [0, 9, 2, "petalLight"],
  [3, 9, 2, "petalLight"],
  // y = 10: the inner bud, open toward the front-left
  [2, 10, -1, "petalLight"],
  [1, 10, 0, "petal"],
  [2, 10, 0, "petalLight"],
  [2, 10, 1, "petal"],
];

/**
 * @param {object} o
 * @param {number} o.size     world size of one voxel
 * @param {Array<[number, number, number, string]>} [o.layout]
 * @returns {{ group: THREE.Group, update(dt: number, spread: number): boolean, dispose(): void }}
 */
export function buildVoxelFlower({ size = 0.16, layout = ROSE } = {}) {
  const rng = mulberry32(1203);
  const voxels = layout.map(([x, y, z, group]) => ({ x, y, z, group }));
  const top = Math.max(1, ...voxels.map((v) => v.y));
  const geometry = new THREE.BoxGeometry(size * 0.92, size * 0.92, size * 0.92); // small gaps keep the grid legible
  const material = new THREE.MeshStandardMaterial({ roughness: 0.62, metalness: 0, flatShading: true });
  const mesh = new THREE.InstancedMesh(geometry, material, voxels.length);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  const color = new THREE.Color();
  const center = new THREE.Vector3(0, top * 0.6, 0).multiplyScalar(size);
  voxels.forEach((v, i) => {
    const group = COLORS[v.group] ?? COLORS.petal;
    mesh.setColorAt(i, color.set(group[Math.floor(rng() * group.length)]));
    v.home = new THREE.Vector3(v.x, v.y + 0.5, v.z).multiplyScalar(size);
    v.scale = 1;
    if (v.group === "thorn") {
      // a thorn is a half-size voxel pressed against the stem beside it
      const stem = voxels.find((o) => o.group === "stem" && o.y === v.y && Math.abs(o.x - v.x) + Math.abs(o.z - v.z) === 1);
      if (stem) v.home.add(new THREE.Vector3(stem.x - v.x, 0, stem.z - v.z).multiplyScalar(size * 0.3));
      v.scale = 0.5;
    }
    v.out = v.home.clone().sub(center).normalize(); // direction for the exploded view
    // build from the ground up: soil first, then the stem grows, then the bloom opens
    v.delay = 0.25 + (v.y / top) * 1.0 + rng() * 0.12;
    v.drop = (2 + rng() * 2) * size;
  });
  mesh.instanceColor.needsUpdate = true;

  // the rose stands still (only the tree moves in the wind)
  const group = new THREE.Group();
  group.add(mesh);

  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();
  let t = 0;
  const BUILD = 0.75; // seconds for one voxel to fall into place
  const total = Math.max(...voxels.map((v) => v.delay)) + BUILD;

  function place(spread) {
    voxels.forEach((v, i) => {
      const k = easeOutCubic((t - v.delay) / BUILD);
      p.copy(v.home).addScaledVector(v.out, spread * size * 6);
      p.y += (1 - k) * v.drop;
      s.setScalar(Math.max(1e-4, k * v.scale));
      m.compose(p, q, s);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }
  place(0);
  let settled = false;
  let lastSpread = 0;

  return {
    group,
    /** Advance the build-in animation; returns true while voxels are still settling. */
    update(dt, spread) {
      t += dt;
      // once built and at rest, the matrices stop changing: skip the rewrite and the upload
      const done = t >= total;
      if (!(done && settled && spread === lastSpread)) place(spread);
      settled = done;
      lastSpread = spread;
      return t < total;
    },
    /** Skip the build-in (reduced motion). */
    finish() {
      t = total;
      place(0);
    },
    dispose() {
      geometry.dispose();
      material.dispose();
      mesh.dispose();
    },
  };
}
