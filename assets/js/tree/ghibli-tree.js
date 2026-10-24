// A Ghibli-style "fluffy" tree: the continuous, painterly half of the scene.
//
// The crown is a few overlapping blobs, each filled with small camera-facing cards that carry a
// cloud-like leaf-clump mask. All four corners of a card share one centre and one normal, and the
// normal points away from the blob and crown centres, so the whole crown shades like one soft sphere
// while the light bands follow the jagged outlines of the clumps. Shading is quantized into a four-tone
// ramp, the look of hand-painted backgrounds. The crown is one geometry and one draw call.
import * as THREE from "three";

// Deterministic PRNG, so the tree is the same on every visit.
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

// sunny broadleaf, brightest band first (sRGB)
const RAMP = ["#bfe07a", "#7dbf5a", "#3f9160", "#235e52"];
const BANDS = new THREE.Vector3(0.84, 0.62, 0.4);
const TRUNK = "#6e5646";

// Leaf-clump mask: a 2 x 2 atlas of puffy clumps. G = alpha (alphaMap reads .g), R = brightness inside
// the clump (lighter toward the upper left, where the sun is).
function makeLeafMask(rng, size = 256) {
  const cells = 2;
  const cell = size / cells;
  const mask = document.createElement("canvas");
  const shade = document.createElement("canvas");
  mask.width = mask.height = shade.width = shade.height = size;
  const m = mask.getContext("2d");
  const s = shade.getContext("2d");
  m.fillStyle = s.fillStyle = "#000";
  m.fillRect(0, 0, size, size);
  s.fillRect(0, 0, size, size);
  m.fillStyle = "#fff";
  const puff = (x, y, r) => {
    m.beginPath();
    m.arc(x, y, r, 0, Math.PI * 2);
    m.fill();
  };
  for (let cy = 0; cy < cells; cy++) {
    for (let cx = 0; cx < cells; cx++) {
      const ox = (cx + 0.5) * cell;
      const oy = (cy + 0.5) * cell;
      // a rounded core with scalloped edges: a few big puffs plus a ring of medium ones
      const core = 4 + Math.floor(rng() * 3);
      for (let i = 0; i < core; i++) {
        const a = rng() * Math.PI * 2;
        const d = cell * 0.1 * Math.sqrt(rng());
        puff(ox + Math.cos(a) * d, oy + Math.sin(a) * d * 0.85, cell * (0.19 + rng() * 0.05));
      }
      const rim = 7 + Math.floor(rng() * 3);
      for (let i = 0; i < rim; i++) {
        const a = (i / rim) * Math.PI * 2 + rng() * 0.5;
        const d = cell * (0.22 + rng() * 0.05);
        puff(ox + Math.cos(a) * d, oy + Math.sin(a) * d, cell * (0.09 + rng() * 0.05));
      }
      const g = s.createRadialGradient(ox - cell * 0.14, oy - cell * 0.16, cell * 0.02, ox + cell * 0.05, oy + cell * 0.06, cell * 0.46);
      g.addColorStop(0, "rgb(235,235,235)");
      g.addColorStop(1, "rgb(70,70,70)");
      s.fillStyle = g;
      s.fillRect(cx * cell, cy * cell, cell, cell);
    }
  }
  const out = document.createElement("canvas");
  out.width = out.height = size;
  const o = out.getContext("2d");
  const mi = m.getImageData(0, 0, size, size).data;
  const si = s.getImageData(0, 0, size, size).data;
  const img = o.createImageData(size, size);
  for (let i = 0; i < mi.length; i += 4) {
    img.data[i] = si[i];
    img.data[i + 1] = mi[i];
    img.data[i + 3] = 255;
  }
  o.putImageData(img, 0, 0);
  const texture = new THREE.CanvasTexture(out);
  texture.colorSpace = THREE.NoColorSpace;
  texture.anisotropy = 4;
  return { texture, size, cells };
}

const CORNERS = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1],
];

function buildCrownGeometry(blobs, crown, baseY, rng, cells, density) {
  const P = [];
  const N = [];
  const UV = [];
  const C = [];
  const CORNER = [];
  const LEAF = [];
  const WIND = [];
  const IDX = [];
  let vert = 0;
  const dir = new THREE.Vector3();
  const p = new THREE.Vector3();
  const nrm = new THREE.Vector3();
  let yMax = -Infinity;
  for (const b of blobs) yMax = Math.max(yMax, b.c.y + b.r);

  for (const b of blobs) {
    const count = Math.max(10, Math.round(density * b.r * b.r));
    for (let q = 0; q < count; q++) {
      // a random direction on the unit sphere
      const u = rng() * 2 - 1;
      const t = rng() * Math.PI * 2;
      const sq = Math.sqrt(1 - u * u);
      dir.set(sq * Math.cos(t), u, sq * Math.sin(t));
      if (dir.y < -0.55 && rng() < 0.6) continue; // fewer cards underneath, where nobody looks
      const rr = b.r * (0.55 + 0.42 * Math.sqrt(rng()));
      p.copy(b.c).addScaledVector(dir, rr);
      p.y = b.c.y + (p.y - b.c.y) * 0.88;
      nrm.copy(p).sub(crown).normalize().multiplyScalar(0.5).addScaledVector(dir, 0.5);
      nrm.x += (rng() - 0.5) * 0.24;
      nrm.y += (rng() - 0.5) * 0.24;
      nrm.z += (rng() - 0.5) * 0.24;
      nrm.normalize();
      const half = b.r * (0.4 + rng() * 0.2);
      const rot = rng() * Math.PI * 2;
      const rand01 = rng();
      const surface = (rr / b.r - 0.55) / 0.42;
      const interior = Math.min(1, 0.35 + 0.65 * surface) * (0.78 + 0.22 * (dir.y * 0.5 + 0.5));
      const h01 = Math.min(1, Math.max(0, (p.y - baseY) / Math.max(0.01, yMax - baseY)));
      const cellIndex = Math.floor(rng() * cells * cells);
      const cu = (cellIndex % cells) / cells;
      const cv = Math.floor(cellIndex / cells) / cells;
      const shade = (0.95 + rng() * 0.1) * b.tint;
      for (let k = 0; k < 4; k++) {
        P.push(p.x, p.y, p.z);
        N.push(nrm.x, nrm.y, nrm.z);
        UV.push(cu + (CORNERS[k][0] * 0.5 + 0.5) / cells, cv + (CORNERS[k][1] * 0.5 + 0.5) / cells);
        C.push(shade, shade, shade);
        CORNER.push(CORNERS[k][0], CORNERS[k][1]);
        LEAF.push(rot, half, rand01, interior);
        WIND.push(rand01 * 0.6, h01);
      }
      IDX.push(vert, vert + 1, vert + 2, vert, vert + 2, vert + 3);
      vert += 4;
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(P, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(N, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(UV, 2));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(C, 3));
  geometry.setAttribute("aCorner", new THREE.Float32BufferAttribute(CORNER, 2));
  geometry.setAttribute("aLeaf", new THREE.Float32BufferAttribute(LEAF, 4));
  geometry.setAttribute("aWind", new THREE.Float32BufferAttribute(WIND, 2));
  geometry.setIndex(IDX);
  geometry.computeBoundingSphere();
  geometry.boundingSphere.radius += 1; // the cards reach past their centres
  return geometry;
}

const VERT_PARS = /* glsl */ `
attribute vec2 aCorner;
attribute vec4 aLeaf; // x rotation, y half size, z random, w interior
attribute vec2 aWind; // x phase, y height in crown (0..1)
uniform vec3 uBbRight;
uniform vec3 uBbUp;
uniform float uTime;
`;

// Billboard in world space with the main camera's right/up vectors, so the shadow pass builds the
// exact same quads as the colour pass (a view-space billboard would turn toward the light there).
const VERT_BILLBOARD = /* glsl */ `
vec3 cardCenter = transformed;
{
  float h2 = aWind.y * aWind.y;
  float sway = sin( uTime * 0.9 + aWind.x ) * 0.7 + sin( uTime * 2.1 + aWind.x * 1.3 ) * 0.3;
  transformed += vec3( 0.894, 0.0, 0.447 ) * ( sway * 0.05 * h2 );
  transformed.y += sin( uTime * 1.7 + aLeaf.z * 12.0 ) * 0.01;
  cardCenter = transformed;
  float ang = aLeaf.x + sin( uTime * 2.7 + aLeaf.z * 6.2831853 ) * 0.06;
  float sa = sin( ang ), ca = cos( ang );
  vec2 k = vec2( ca * aCorner.x - sa * aCorner.y, sa * aCorner.x + ca * aCorner.y ) * aLeaf.y;
  transformed += uBbRight * k.x + uBbUp * k.y;
}
`;

const IGN = "return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );";

function createFoliageMaterials(mask, shared) {
  const material = new THREE.MeshToonMaterial({ color: 0xffffff, vertexColors: true, alphaMap: mask.texture, alphaTest: 0.5 });
  material.shadowSide = THREE.DoubleSide;
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, shared);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\n" + VERT_PARS + "varying float vInterior;\nvarying vec2 vSunSide;\n")
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\n" +
          VERT_BILLBOARD +
          // where this corner sits on screen (camera right/up), whatever the card's own rotation
          "vInterior = aLeaf.w;\nvSunSide = vec2( cos( aLeaf.x ) * aCorner.x - sin( aLeaf.x ) * aCorner.y, sin( aLeaf.x ) * aCorner.x + cos( aLeaf.x ) * aCorner.y );\n"
      )
      // one shadow lookup per card (at its centre): each clump is fully lit or fully shaded, which
      // reads as a painted patchwork instead of noisy hatching across every card
      .replace(
        "#include <shadowmap_vertex>",
        /* glsl */ `
#if defined( USE_SHADOWMAP ) || NUM_SPOT_LIGHT_COORDS > 0
  vec4 bbWorldPosition = worldPosition;
  worldPosition = modelMatrix * vec4( cardCenter, 1.0 );
#endif
#include <shadowmap_vertex>
#if defined( USE_SHADOWMAP ) || NUM_SPOT_LIGHT_COORDS > 0
  worldPosition = bbWorldPosition;
#endif
`
      );
    const shadowPars = THREE.ShaderChunk.shadowmap_pars_fragment;
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <shadowmap_pars_fragment>", shadowPars.includes(IGN) ? shadowPars.replace(IGN, "return 0.0;") : shadowPars)
      .replace(
        "#include <common>",
        /* glsl */ `#include <common>
uniform vec3 uRamp[ 4 ];
uniform vec3 uBands;
uniform float uLightRef;
uniform float uMaskSize;
varying float vInterior;
varying vec2 vSunSide;
`
      )
      .replace(
        "#include <gradientmap_pars_fragment>",
        /* glsl */ `
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
  float w = saturate( dot( normal, lightDirection ) * 0.5 + 0.5 );
  return vec3( w * w );
}
`
      )
      .replace(
        "#include <alphatest_fragment>",
        /* glsl */ `
#ifdef USE_ALPHAMAP
  {
    // lower mips average the mask below the threshold; boost alpha so small clumps keep their size
    vec2 tdx = dFdx( vAlphaMapUv * uMaskSize ), tdy = dFdy( vAlphaMapUv * uMaskSize );
    float mip = max( 0.0, 0.5 * log2( max( dot( tdx, tdx ), dot( tdy, tdy ) ) ) );
    diffuseColor.a = saturate( diffuseColor.a * ( 1.0 + mip * 0.25 ) );
  }
#endif
#include <alphatest_fragment>
`
      )
      .replace(
        "#include <lights_fragment_end>",
        /* glsl */ `#include <lights_fragment_end>
{
  const vec3 LUMA = vec3( 0.2126, 0.7152, 0.0722 );
  vec3 lit = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
  float albedo = max( dot( material.diffuseColor, LUMA ), 1e-4 );
  float L = dot( lit, LUMA ) / albedo / uLightRef;
  L *= mix( 0.62, 1.0, vInterior );
  #ifdef USE_ALPHAMAP
    // a hint of shading inside each clump, read in screen axes so its light side faces the sun (upper
    // left) on every card, however the card is turned
    vec2 cellUv = floor( vAlphaMapUv * 2.0 ) * 0.5 + ( vSunSide * 0.5 + 0.5 ) * 0.5;
    L += ( texture2D( alphaMap, cellUv ).r - 0.55 ) * 0.07;
  #endif
  float aa = fwidth( L ) * 0.75 + 1e-4;
  vec3 band = uRamp[ 3 ];
  band = mix( band, uRamp[ 2 ], smoothstep( uBands.z - aa, uBands.z + aa, L ) );
  band = mix( band, uRamp[ 1 ], smoothstep( uBands.y - aa, uBands.y + aa, L ) );
  band = mix( band, uRamp[ 0 ], smoothstep( uBands.x - aa, uBands.x + aa, L ) );
  reflectedLight.directDiffuse = band * material.diffuseColor;
  reflectedLight.indirectDiffuse = vec3( 0.0 );
}
`
      );
  };
  material.customProgramCacheKey = () => "ghibli-foliage-v1";

  const depthMaterial = new THREE.MeshDepthMaterial({ alphaMap: mask.texture, alphaTest: 0.5 });
  depthMaterial.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, shared);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\n" + VERT_PARS)
      .replace("#include <begin_vertex>", "#include <begin_vertex>\n" + VERT_BILLBOARD);
    // a slightly higher cut-off in the shadow pass leaves gaps of light: dappled shade on the grass
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <alphatest_fragment>",
      "#ifdef USE_ALPHAMAP\n  if ( diffuseColor.a < 0.6 ) discard;\n#endif"
    );
  };
  depthMaterial.customProgramCacheKey = () => "ghibli-foliage-depth-v1";
  return { material, depthMaterial };
}

function taperedTube(curve, r0, r1, segments = 24, radial = 12) {
  const frames = curve.computeFrenetFrames(segments, false);
  const pos = [];
  const nor = [];
  const idx = [];
  const p = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    curve.getPointAt(t, p);
    const r = r0 + (r1 - r0) * Math.pow(t, 0.8);
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      n.copy(frames.normals[i]).multiplyScalar(Math.cos(a)).addScaledVector(frames.binormals[i], Math.sin(a));
      pos.push(p.x + n.x * r, p.y + n.y * r, p.z + n.z * r);
      nor.push(n.x, n.y, n.z);
    }
  }
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * (radial + 1) + j;
      const b = a + radial + 1;
      idx.push(a, a + 1, b, b, a + 1, b + 1); // counter-clockwise seen from outside
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setIndex(idx);
  return g;
}

/**
 * @param {object} o
 * @param {number} o.seed
 * @param {number} o.size      crown radius in world units (the tree is about 4 x this tall)
 * @param {number} o.density   leaf cards per blob, x blob radius squared
 * @param {number} o.lightRef  luminance of full light (key + sky), so the ramp bands sit right
 */
export function buildGhibliTree({ seed = 20261021, size = 1.05, density = 80, lightRef = 1 } = {}) {
  const rng = mulberry32(seed);
  const U = (a, b) => a + (b - a) * rng();
  const group = new THREE.Group();
  const disposables = [];

  // crown: one big blob, a ring of satellites a little lower, and one on top
  // (a crown a little wider than tall, with an uneven, lumpy outline)
  const trunkH = size * 1.5;
  const crown = new THREE.Vector3(0.05 * size, trunkH + size * 0.7, 0);
  const blobs = [{ c: crown.clone(), r: size, tint: 1 }];
  const satellites = 7;
  for (let i = 0; i < satellites; i++) {
    const a = (i / satellites) * Math.PI * 2 + U(-0.3, 0.3);
    const off = size * U(0.7, 1.05);
    blobs.push({
      c: crown.clone().add(new THREE.Vector3(Math.cos(a) * off, U(-0.45, 0.15) * size, Math.sin(a) * off * 0.8)),
      r: size * U(0.48, 0.78),
      tint: U(0.94, 1.06),
    });
  }
  blobs.push({ c: crown.clone().add(new THREE.Vector3(U(-0.15, 0.15) * size, size * 0.68, U(-0.1, 0.1) * size)), r: size * 0.62, tint: 1.04 });

  // trunk with a gentle S-curve, and branches reaching into the lower blobs
  const gradientMap = new THREE.DataTexture(new Uint8Array([120, 195, 255]), 3, 1, THREE.RedFormat);
  gradientMap.minFilter = gradientMap.magFilter = THREE.NearestFilter;
  gradientMap.needsUpdate = true;
  const bark = new THREE.MeshToonMaterial({ color: TRUNK, gradientMap });
  const trunkCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -0.15, 0),
    new THREE.Vector3(0.05, trunkH * 0.4, 0.02),
    new THREE.Vector3(-0.06, trunkH * 0.8, -0.02),
    crown.clone().setY(crown.y - size * 0.2),
  ]);
  const parts = [taperedTube(trunkCurve, size * 0.19, size * 0.07)];
  const lower = blobs
    .slice(1, 1 + satellites)
    .sort((a, b) => a.c.y - b.c.y)
    .slice(0, 3);
  for (const b of lower) {
    const from = trunkCurve.getPointAt(U(0.62, 0.8));
    const to = b.c.clone().lerp(from, 0.3);
    const mid = from
      .clone()
      .lerp(to, 0.5)
      .add(new THREE.Vector3(0, size * 0.12, 0));
    parts.push(taperedTube(new THREE.CatmullRomCurve3([from, mid, to]), size * 0.075, size * 0.03, 12, 8));
  }
  for (const g of parts) {
    const m = new THREE.Mesh(g, bark);
    m.castShadow = m.receiveShadow = true;
    group.add(m);
  }
  // a soft flare where the trunk meets the ground
  const flareGeometry = new THREE.SphereGeometry(size * 0.24, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2);
  const flare = new THREE.Mesh(flareGeometry, bark);
  flare.scale.set(1, 0.55, 1);
  flare.position.y = -0.1;
  flare.castShadow = flare.receiveShadow = true;
  group.add(flare);
  disposables.push(...parts, flareGeometry, bark, gradientMap);

  // the crown
  const mask = makeLeafMask(rng);
  const shared = {
    uBbRight: { value: new THREE.Vector3(1, 0, 0) },
    uBbUp: { value: new THREE.Vector3(0, 1, 0) },
    uTime: { value: 0 },
    uRamp: { value: RAMP.map((c) => new THREE.Color(c)) },
    uBands: { value: BANDS },
    uLightRef: { value: lightRef },
    uMaskSize: { value: mask.size },
  };
  const geometry = buildCrownGeometry(blobs, crown, trunkH * 0.5, rng, mask.cells, density);
  const { material, depthMaterial } = createFoliageMaterials(mask, shared);
  const foliage = new THREE.Mesh(geometry, material);
  foliage.customDepthMaterial = depthMaterial;
  foliage.castShadow = foliage.receiveShadow = true;
  group.add(foliage);
  disposables.push(geometry, material, depthMaterial, mask.texture);

  return {
    group,
    cards: geometry.getAttribute("position").count / 4,
    /** Face the cards to the camera and move them in the wind (t stops while motion is off). */
    update(t, camera) {
      shared.uTime.value = t;
      camera.updateMatrixWorld();
      shared.uBbRight.value.setFromMatrixColumn(camera.matrixWorld, 0);
      shared.uBbUp.value.setFromMatrixColumn(camera.matrixWorld, 1);
    },
    dispose() {
      for (const d of disposables) d.dispose();
    },
  };
}
