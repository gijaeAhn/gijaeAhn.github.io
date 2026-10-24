// Profile scene: a soft, painterly Ghibli-style tree and a small voxel rose on one floating island. The
// island turns from continuous under the tree to discrete under the rose, with voxels that grow from
// pixel-sized grains to the rose's own blocks.
import * as THREE from "three";
import { buildGhibliTree } from "tree/ghibli-tree";
import { buildIsland, yieldToMain } from "tree/island";
import { buildVoxelFlower } from "tree/voxel-flower";

const DEG = Math.PI / 180;
// one voxel size for the rose and the island's coarsest blocks, so the rose stands on their grid
const VOXEL = 0.16;
const easeOutCubic = (t) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

/**
 * Start the scene in a container that holds a <canvas>. Throws (after cleaning up) if WebGL2 is
 * unavailable or a shader fails, so the caller can show the photo instead. If the GL context is lost
 * later and does not come back, the container gets a "profile-scene-failed" event.
 * options.view tweaks the framing; options.flowerLayout replaces the rose.
 */
export async function init(container, options = {}) {
  const canvas = container.querySelector("canvas");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const coarse = matchMedia("(pointer: coarse)").matches; // phones and tablets: lighter settings
  const view = { yaw: -24, pitch: 14, distance: 1.1, treeX: -1.6, treeSize: 1.15, flowerX: 1.75, key: 2.6, hemi: 1.8, ...options.view };

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" });

  // Everything init attaches or builds is undone by dispose(), so a failure leaves nothing running or
  // holding on to the GL context.
  const cleanups = [];
  const parts = [];
  const listen = (target, type, handler, opts) => {
    target.addEventListener(type, handler, opts);
    cleanups.push(() => target.removeEventListener(type, handler, opts));
  };
  let ready = false; // nothing renders or animates until the shaders are in
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    ready = false;
    for (const cleanup of cleanups) cleanup();
    for (const part of parts) part.dispose();
    renderer.setAnimationLoop(null);
    renderer.dispose();
    if (!renderer.getContext().isContextLost()) renderer.forceContextLoss();
  };

  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.NeutralToneMapping;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 200);

  // one light set: soft sky/ground fill, a warm key from the upper left, a cool fill from the right
  const hemi = new THREE.HemisphereLight(0xffffff, 0xcfc6b6, view.hemi);
  const key = new THREE.DirectionalLight(0xfff1dc, view.key);
  key.position.set(-5, 10, 6);
  key.castShadow = true;
  // ~100 shadow texels per unit: at or above what the canvas resolves, a quarter of the work of 2048
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.radius = 2;
  key.shadow.bias = -0.0005;
  key.shadow.normalBias = 0.03;
  key.shadow.intensity = 0.6; // soft, painted shade rather than black holes in the crown
  Object.assign(key.shadow.camera, { left: -5, right: 5, top: 7, bottom: -5, near: 0.5, far: 30 });
  const fill = new THREE.DirectionalLight(0xdfe7ff, 0.5);
  fill.position.set(6, 4, -4);
  scene.add(hemi, key, fill);

  // the island, the tree planted on its smooth half, the rose on its coarsest voxels
  let island, tree, flower;
  try {
    // phones get one octree level less (grains of about two pixels instead of one) and a coarser
    // smooth half; the build yields to the page now and then, so it never blocks for long
    island = await buildIsland({ voxel: VOXEL, levels: coarse ? 2 : 3, resolution: coarse ? 48 : 64 });
    parts.push(island);
    scene.add(island.group);
    await yieldToMain();
    // the foliage ramp is keyed to the full light (key + sky + a little fill), so its bands sit right
    const luminance = (c) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
    const lightRef =
      (luminance(key.color) * key.intensity + luminance(hemi.color) * hemi.intensity + 0.25 * luminance(fill.color) * fill.intensity) / Math.PI;
    tree = buildGhibliTree({ size: view.treeSize, lightRef });
    parts.push(tree);
    tree.group.position.set(view.treeX, island.topAt(view.treeX, 0), 0);
    scene.add(tree.group);
    flower = buildVoxelFlower({ size: VOXEL, layout: options.flowerLayout });
    parts.push(flower);
    const spot = island.snap(view.flowerX, 0);
    flower.group.position.set(spot.x, 0, spot.z);
    scene.add(flower.group);
    if (reduceMotion.matches) flower.finish();
  } catch (err) {
    dispose();
    throw err;
  }

  // ---------------------------------------------------------------- framing
  const bounds = new THREE.Box3().setFromObject(scene);
  const target = bounds.getCenter(new THREE.Vector3());
  const extent = bounds.getSize(new THREE.Vector3());
  let radius = 1;
  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    // with no size yet (not laid out), keep the square framing so the camera still starts outside the
    // island; the ResizeObserver comes back once the box has a size
    if (w && h) {
      const dpr = Math.min(devicePixelRatio, 2);
      if (renderer.getPixelRatio() !== dpr) renderer.setPixelRatio(dpr);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    // distance that fits the whole island and tree, whichever way the camera swings
    const tan = Math.tan((camera.fov / 2) * DEG);
    const fitH = (extent.y * 0.56) / tan;
    const fitW = (Math.max(extent.x, extent.z) * 0.56) / (tan * camera.aspect);
    radius = Math.max(fitH, fitW) * view.distance;
  }

  // ---------------------------------------------------------------- loop state
  let visible = true;
  let running = false;
  let last = 0;
  let nextDraw = 0;
  let elapsed = 0;
  let settle = 0;
  const swing = 12 * DEG; // the camera drifts slowly left and right, 26 s per cycle
  // phones draw at most 40 frames a second: the motion is slow, and the GPU and battery are small
  const minFrameMs = coarse ? 1000 / 40 : 0;

  // ---------------------------------------------------------------- interaction
  let yaw = view.yaw * DEG;
  let dragYaw = 0;
  let dragId = null; // one pointer at a time drags the view
  let dragStart = 0;
  let hover = 0;
  let hoverTarget = 0;
  let burst = 0; // a click briefly opens the voxels
  const motionOn = () => !reduceMotion.matches && container.getAttribute("data-paused") !== "true";

  let downX = 0;
  let downY = 0;
  listen(canvas, "pointerdown", (e) => {
    wake();
    if (dragId !== null || e.button !== 0) return; // primary button only
    dragId = e.pointerId;
    dragStart = downX = e.clientX;
    downY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });
  const endDrag = (e) => {
    if (e.pointerId !== dragId) return;
    dragId = null;
    wake();
  };
  listen(canvas, "pointermove", (e) => {
    if (e.pointerId !== dragId) return;
    if (e.pointerType === "mouse" && !(e.buttons & 1)) return endDrag(e); // the mouseup was lost (e.g. a context menu)
    dragYaw = THREE.MathUtils.clamp(dragYaw + (e.clientX - dragStart) * 0.006, -0.9, 0.9);
    dragStart = e.clientX;
    wake();
  });
  listen(canvas, "pointerup", (e) => {
    // a tap or click (not a drag, not the start of a page scroll) opens the voxels for a moment
    const tap = e.pointerId === dragId && Math.hypot(e.clientX - downX, e.clientY - downY) < 6;
    if (ready && tap && !reduceMotion.matches) burst = 1;
    endDrag(e);
  });
  listen(canvas, "pointercancel", endDrag);
  listen(canvas, "lostpointercapture", endDrag);
  listen(container, "pointerenter", (e) => {
    if (e.pointerType !== "mouse" || reduceMotion.matches) return; // touch has no hover; a tap gives the burst
    hoverTarget = 0.2;
    wake();
  });
  listen(container, "pointerleave", () => {
    hoverTarget = 0;
    wake();
  });

  // pause / play (WCAG 2.2.2): the button lives in the frame
  const button = container.querySelector(".profile-scene-toggle");
  const KEY = "profile-scene-motion";
  try {
    if (localStorage.getItem(KEY) === "paused") container.setAttribute("data-paused", "true");
  } catch (e) {}
  const syncButton = () => button?.setAttribute("aria-pressed", String(container.getAttribute("data-paused") === "true"));
  syncButton();
  if (button) {
    listen(button, "click", (e) => {
      e.stopPropagation();
      const paused = container.getAttribute("data-paused") !== "true";
      container.setAttribute("data-paused", String(paused));
      try {
        if (paused) localStorage.setItem(KEY, "paused");
        else localStorage.removeItem(KEY);
      } catch (err) {}
      syncButton();
      wake();
    });
  }

  // ---------------------------------------------------------------- loop (only while visible)
  // elapsed stops while motion is off, so pausing freezes the camera where it is instead of snapping it back
  function placeCamera() {
    const a = yaw + dragYaw + Math.sin((elapsed / 26) * Math.PI * 2) * swing;
    const p = view.pitch * DEG;
    camera.position.set(
      target.x + Math.sin(a) * Math.cos(p) * radius,
      target.y + Math.sin(p) * radius,
      target.z + Math.cos(a) * Math.cos(p) * radius
    );
    camera.lookAt(target);
    tree.update(elapsed, camera); // the leaf cards face the camera
  }

  function frame(now) {
    if (now < nextDraw - 2) return; // skip this one; the canvas keeps the last frame
    nextDraw = Math.max(nextDraw + minFrameMs, now); // a deadline, so 60 and 90 Hz screens get 40 fps too
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    const motion = motionOn();
    if (motion) elapsed += dt;

    hover += (hoverTarget - hover) * (1 - Math.exp(-dt / 0.18));
    if (Math.abs(hoverTarget - hover) < 1e-4) hover = hoverTarget; // settle exactly, so nothing re-uploads at rest
    burst = Math.max(0, burst - dt / 0.56);
    const spread = reduceMotion.matches ? 0 : hover + 0.3 * easeOutCubic(burst);
    const building = flower.update(motion ? dt : 1, spread);
    island.update(elapsed, spread);

    const dragging = dragId !== null;
    if (!dragging) dragYaw *= Math.exp(-dt * 1.2); // let go: drift back to the resting angle
    placeCamera();
    renderer.render(scene, camera);

    settle -= dt;
    const busy = building || dragging || Math.abs(hover - hoverTarget) > 0.002 || burst > 0 || Math.abs(dragYaw) > 0.002 || settle > 0;
    if (!visible || (!motion && !busy)) queueMicrotask(sleep); // three schedules the next frame after this callback
  }
  function wake() {
    settle = 0.3;
    if (!ready || running || !visible || document.hidden) return;
    running = true;
    last = performance.now();
    renderer.setAnimationLoop(frame);
  }
  function sleep() {
    running = false;
    renderer.setAnimationLoop(null);
  }

  const io = new IntersectionObserver((entries) => {
    visible = entries[entries.length - 1].isIntersecting; // the newest entry wins
    if (visible) wake();
  });
  io.observe(container);
  cleanups.push(() => io.disconnect());
  listen(document, "visibilitychange", () => (document.hidden ? sleep() : wake()));
  listen(reduceMotion, "change", () => {
    hover = hoverTarget = burst = 0;
    wake();
  });

  // resizing (or a zoom / move to another screen, which changes the pixel ratio) clears the drawing
  // buffer: draw again right away, before the browser paints
  const redraw = () => {
    resize();
    if (!ready) return;
    placeCamera();
    renderer.render(scene, camera);
    wake();
  };
  const ro = new ResizeObserver(redraw);
  ro.observe(container);
  cleanups.push(() => ro.disconnect());
  let dprQuery;
  const onDpr = () => {
    redraw();
    watchDpr();
  };
  const watchDpr = () => {
    dprQuery = matchMedia(`(resolution: ${devicePixelRatio}dppx)`);
    dprQuery.addEventListener("change", onDpr, { once: true });
  };
  watchDpr();
  cleanups.push(() => dprQuery.removeEventListener("change", onDpr));

  // a lost GL context leaves the canvas blank: draw again once it is back, or give up and let the page
  // show the photo if it does not return
  let lostTimer = 0;
  listen(canvas, "webglcontextlost", () => {
    sleep();
    lostTimer = setTimeout(() => {
      dispose();
      container.dispatchEvent(new Event("profile-scene-failed"));
    }, 4000);
  });
  listen(canvas, "webglcontextrestored", () => {
    clearTimeout(lostTimer);
    redraw();
  });
  cleanups.push(() => clearTimeout(lostTimer));

  resize();
  placeCamera();
  const gl = renderer.getContext();
  const lostError = () => new Error("profile scene: WebGL context lost");
  // a context lost while starting up gets the same grace as one lost later: wait for it to come back
  // (up to 4 s), then compile again
  const restored = () =>
    new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(lostError()), 4000);
      cleanups.push(() => clearTimeout(timer));
      listen(
        canvas,
        "webglcontextrestored",
        () => {
          clearTimeout(timer);
          resolve();
        },
        { once: true }
      );
    });
  // three's compile poll can report done on a lost context (or never settle after a restore), so a
  // loss cuts the wait short
  const warm = () =>
    new Promise((resolve, reject) => {
      const onLost = () => reject(lostError());
      canvas.addEventListener("webglcontextlost", onLost, { once: true });
      compileAll()
        .then(resolve, reject)
        .finally(() => canvas.removeEventListener("webglcontextlost", onLost));
    });
  try {
    for (let attempt = 0; ; attempt++) {
      try {
        if (gl.isContextLost()) throw lostError();
        await warm();
        // first use links every program (the shadow pass's too); a failed one shows up here
        renderer.render(scene, camera);
        if (gl.isContextLost()) throw lostError();
      } catch (err) {
        if (!gl.isContextLost() || attempt >= 2) throw err;
        await restored(); // three's own listener has rebuilt its GL state by then
        continue;
      }
      if (renderer.info.programs.some((program) => program.diagnostics && !program.diagnostics.runnable)) {
        throw new Error("profile scene: WebGL program failed");
      }
      break;
    }
  } catch (err) {
    dispose();
    throw err;
  }
  ready = true;
  container.classList.add("is-ready");
  canvas.removeAttribute("aria-hidden");
  wake();
  return { renderer, scene, camera, tree, flower, island };

  // Compile every program before the first frame, off the main thread where the driver allows it.
  // compileAsync(scene, camera) only covers the colour pass, so the shadow pass's depth programs are
  // warmed first with stand-ins that match it: the side it draws, and an offscreen target (no tone
  // mapping, linear output). The stand-ins are not disposed, so the programs stay cached for that pass.
  async function compileAll() {
    const flip = { [THREE.FrontSide]: THREE.BackSide, [THREE.BackSide]: THREE.FrontSide, [THREE.DoubleSide]: THREE.DoubleSide };
    const casters = [];
    scene.traverse((o) => {
      if (!o.isMesh || !o.castShadow) return;
      casters.push([o, o.material]);
      const depth = o.customDepthMaterial ?? new THREE.MeshDepthMaterial(); // one per caster: compileAsync waits per material
      depth.side = o.material.shadowSide ?? flip[o.material.side];
      o.material = depth;
    });
    const offscreen = new THREE.WebGLRenderTarget(1, 1);
    let shadows;
    try {
      renderer.setRenderTarget(offscreen);
      shadows = renderer.compileAsync(scene, camera); // its synchronous part runs right here
    } finally {
      // put everything back even if that throws (e.g. on a lost context), so a retry starts clean
      renderer.setRenderTarget(null);
      offscreen.dispose();
      for (const [o, material] of casters) o.material = material;
    }
    await Promise.all([shadows, renderer.compileAsync(scene, camera)]);
  }
}
