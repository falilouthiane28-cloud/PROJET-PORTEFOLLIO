# LCP-friendly, high-performance Three.js hero (single 3D object: pearl/ceramic ringed planet)

> Scope: shipping one procedural 3D hero object (planet + ring, pearl/ceramic material) on a marketing site, targeting mid-range Android on 4G and desktop, without hurting Core Web Vitals. Researched 2026-09-30. Note: the three.js manual pages (`threejs.org/manual/en/offscreencanvas.html`, `.../cleanup.html`, and their raw GitHub copies) returned HTTP 404 during this session, so the manual's own wording on OffscreenCanvas and Cleanup could not be verified; claims resting only on background knowledge are listed under Gaps, not Findings.

## Poster-first pattern and import timing

### Takeaway
A `<canvas>`/WebGL surface can never be the LCP element, so the LCP must be carried by a real image (AVIF/WebP poster) or the hero headline; three.js should load only after that paint, triggered after `load` via `requestIdleCallback` with a `setTimeout` fallback, because Safari (desktop and iOS, through 27.2) still ships `requestIdleCallback` disabled by default.

### Cited Findings
- LCP candidates are `<img>`, `<image>` inside `<svg>`, `<video>`, elements with a CSS `url()` background image, and block-level text elements. **Canvas and WebGL are not considered for LCP.** — [web.dev, LCP](https://web.dev/articles/lcp)
- Thresholds: good at 2.5 s or less, poor above 4.0 s, measured at the **75th percentile** of page loads, segmented by mobile and desktop. — [web.dev, LCP](https://web.dev/articles/lcp)
- LCP heuristics exclude elements with opacity 0, elements covering the full viewport (treated as background), and "placeholder images or other images with a low entropy". — [web.dev, LCP](https://web.dev/articles/lcp)
- `requestIdleCallback` support: Chrome 47+, Firefox 55+, Samsung Internet 5+, Chrome Android supported; **Safari desktop is disabled by default in 13.1 to 27.2 and iOS Safari in 13.4 to 27.2** (enabled only in Technology Preview). Global usage is about 81%. — [caniuse, requestIdleCallback](https://caniuse.com/requestidlecallback)
- For any glTF asset that is needed early, preload it with `<link rel="preload" href="/model.glb" as="fetch" crossorigin>`. The `crossorigin` attribute is required even for same-origin files, otherwise the preload is not reused. — [Utsubo, 100 Three.js Tips (2026)](https://www.utsubo.com/blog/threejs-best-practices-100-tips)

### Inferences
- Recommended sequence: (1) the server-rendered `<img fetchpriority="high">` AVIF poster, or the H1, paints as the LCP. (2) After `window` `load`, call `requestIdleCallback(start, {timeout: 2000})`, falling back to `setTimeout(start, 1)` on Safari. (3) `await import('three')` and build the scene. (4) `await renderer.compileAsync(scene, camera)`. (5) Render the first frame into a canvas at opacity 0. (6) Crossfade the canvas over the poster with CSS opacity (300 to 600 ms), then remove or `decode()`-free the poster. Because a canvas is never an LCP candidate, adding it later cannot worsen LCP.
- The poster must be a real, detailed render of the same planet. A blurry, low-entropy placeholder risks exclusion as an LCP candidate. A full-viewport poster is also treated as background, so the LCP then falls back to the headline text. That is usually fine, even faster.
- Gate the import entirely, keeping the static poster, when `prefers-reduced-motion: reduce` is set, when `navigator.connection.saveData` is true or `effectiveType` is `2g`/`slow-2g`, or when WebGL context creation fails.
- Optionally defer until the hero is actually visible (IntersectionObserver) or until first interaction on low tiers. The poster already provides the visual, so the 3D is a progressive enhancement.
- TBT risk comes from three sources: parse/eval of a ~150 kB-gzip module, WebGL context creation, and synchronous shader compile on first render. Doing all three after `load` keeps them out of the LCP window. Splitting them across tasks (import, then `compileAsync`, then first render in rAF) avoids a single long task.

### Gaps
- No primary source fetched on Chrome's exact low-entropy threshold for LCP images (background knowledge: about 0.05 bits per pixel). Verify on developer.chrome.com LCP changelog before quoting.
- No measured TBT/INP numbers were found for "three.js imported at idle" on a mid-range Android device. This needs a lab test (Lighthouse mobile throttling or WebPageTest on a Moto G-class device).
- `scheduler.yield()` / `scheduler.postTask` support was not checked in this session.

## OffscreenCanvas + Web Worker for three.js

### Takeaway
OffscreenCanvas, including WebGL in workers, is now broadly available: Chrome 69+, Firefox 105+, and Safari/iOS 17.0+ fully; Safari 16.2 to 16.7 only partially. That is about 96% global usage. Running three.js in a worker isolates the hero's animation from main-thread jank. The costs are a shim for `style` sizes, manual input forwarding, and no DOM access.

### Cited Findings
- OffscreenCanvas support: Chrome 69+; Firefox 105+; Safari desktop partial in 16.2 to 16.6 and **full from 17.0**; iOS Safari partial in 16.2 to 16.7 and **full from 17.0**; Chrome for Android supported; Samsung Internet 10.1+. Global usage is **95.99%**. — [caniuse, OffscreenCanvas](https://caniuse.com/offscreencanvas)
- `canvas.transferControlToOffscreen()` detaches rendering from the DOM canvas: "Operations applied to OffscreenCanvas will be rendered on the source canvas automatically". The OffscreenCanvas is transferable and must be passed both in the message and in the transfer list of `postMessage()`. — [web.dev, OffscreenCanvas (Tim Dresser, 2023-12-08)](https://web.dev/articles/offscreen-canvas)
- The web.dev three.js-in-a-worker example feature-detects OffscreenCanvas, then creates `WebGLRenderer` on the transferred canvas. three.js expects `canvas.style.width/height`, and "OffscreenCanvas, as fully detached from DOM, does not have it, so you need to provide it yourself". — [web.dev, OffscreenCanvas](https://web.dev/articles/offscreen-canvas)
- `requestAnimationFrame` is used inside the worker, replacing the deprecated `commit()`. "The busy main thread does not influence the animation running on a worker". Limitations: no DOM in workers, and input events must be forwarded manually. — [web.dev, OffscreenCanvas](https://web.dev/articles/offscreen-canvas)
- three.js r180 included a fix for broken worker support in WebGPURenderer (#31607). — [three.js r180 release](https://github.com/mrdoob/three.js/releases/tag/r180) (via search summary)

### Inferences
- For a single hero object with only pointer parallax, input forwarding is trivial. On the main thread, listen for `pointermove` and `scroll` with `{passive: true}`, normalize to -1..1, and `postMessage({x, y})`, throttled to rAF. No OrbitControls or ElementProxy is needed.
- Resize with a main-thread `ResizeObserver` that posts `{width, height, dpr}`. The worker then calls `renderer.setPixelRatio(dpr)` and `renderer.setSize(w, h, false)`, which avoids touching `style`.
- Pros for this project: shader compile, geometry build and rendering all happen off-main-thread, which directly protects TBT/INP on mid-range Android. Cons: a second bundle (the worker), a message protocol, and harder debugging. There is also a need to keep a main-thread fallback path for the small share without OffscreenCanvas WebGL (older iOS 16).
- Load the worker only in the same idle window as the poster-first sequence. The worker still downloads and parses three.js, so network cost is unchanged, but parse/compile no longer blocks the main thread.
- The poster crossfade needs a "first frame rendered" message from the worker, because the main thread cannot observe the worker's render directly.

### Gaps
- The three.js manual's OffscreenCanvas page (the `ElementProxy` / proxy event pattern, the list of copied event fields, and OrbitControls in a worker) returned 404 at `threejs.org/manual/en/offscreencanvas.html`. Check `https://threejs.org/manual/#en/offscreencanvas` directly.
- caniuse did not detail what "partial" means for Safari 16.2 to 16.7. Background knowledge says 2D context only, no WebGL; unverified here.
- Whether `requestAnimationFrame` in a DedicatedWorker is throttled or paused when the tab is hidden or the canvas is offscreen, on each engine, was not verified. Plan to post an explicit pause message.

## Bundle size and shader-compile jank

### Takeaway
Expect about 150 kB gzip for three.js core, because tree-shaking helps little once `WebGLRenderer` is imported. Shader-compile hitches are avoided by `await renderer.compileAsync(scene, camera)` before the first visible frame; on WebGL this uses `KHR_parallel_shader_compile`.

### Cited Findings
- Forum-reported sizes (older versions, search-snippet level): three.js about **150 kB gzip** for a standard build; `three.module.js` about **155 kB gzip**; one real app at 773 kB minified without tree shaking and 590 kB with it; custom re-export files reported at about **50 to 80 kB**. Tree shaking is limited because importing `WebGLRenderer` pulls in most of the library. — [three.js forum, state of tree-shaking](https://discourse.threejs.org/t/what-is-the-state-of-tree-shaking/33168); [mattdesl/threejs-tree-shake](https://github.com/mattdesl/threejs-tree-shake); [R3F discussion #812](https://github.com/pmndrs/react-three-fiber/discussions/812)
- `WebGLRenderer.compileAsync()` is the asynchronous version of `compile()` and uses the `KHR_parallel_shader_compile` extension; the docs recommend it "whenever possible". It returns a Promise that resolves when the scene can be rendered without stalling on shader compilation. — [three.js docs, WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html)
- `KHR_parallel_shader_compile` allows non-blocking polling of compile/link status, so status can be queried "without potentially incurring stalls". — [MDN, KHR_parallel_shader_compile](https://developer.mozilla.org/en-US/docs/Web/API/KHR_parallel_shader_compile)
- Shaders compile the first time an object renders, which shows as a hitch. Warm up with `compileAsync()` while the loading screen or poster is still displayed. Since **r184**, WebGPURenderer's `compileAsync()` "no longer blocks rendering while it works". — [Utsubo, 100 Three.js Tips (2026)](https://www.utsubo.com/blog/threejs-best-practices-100-tips)
- r185 ensures "valid camera state in compileAsync()" with WebGLRenderer; r184 made `compileAsync()` "truly non-blocking" for WebGPU. — [three.js releases](https://github.com/mrdoob/three.js/releases)
- `WebGPURenderer` has auto-fallback to WebGL 2 since **r171**. WebGPU is reported at about **87% global support** as of September 2026. `renderAsync()`/`computeAsync()` were deprecated in **r181**, and a built-in Inspector ships since r181. — [Utsubo, 100 Three.js Tips (2026)](https://www.utsubo.com/blog/threejs-best-practices-100-tips)
- In drei v11, `<Preload>` does nothing on WebGPU because `gl.compile()` is an async alias there. — [pmndrs/drei issue #2809](https://github.com/pmndrs/drei/issues/2809)
- Latest release: **r186**, listed as the most recent on the GitHub releases page. r186 notes include "async dispose" for renderers and optimized multi-scattering / DFG LUT sampling. — [three.js releases](https://github.com/mrdoob/three.js/releases). **Date conflict:** the fetch tool rendered r183 to r186 dates with year 2024 (Feb 20, Apr 16, Jul 1, Sep 24), which is impossible given the version order; a search summary gave r180 = Sep 3 and r181 = Nov 19 with year 2026, which is also inconsistent. Utsubo's article, "Updated Sep 11th, 2026", says "Current: three.js r186". Treat r186 as current as of September 2026, with exact dates unverified.

### Inferences
- For a hero with one sphere, one ring, one material and no loaders, use the classic `WebGLRenderer` rather than `WebGPURenderer`. It has a smaller and more battle-tested path on mid-range Android WebViews, and `compileAsync` via `KHR_parallel_shader_compile` already solves the jank. WebGPURenderer (with its TSL node system) adds bundle weight with no benefit for one object.
- Import only named symbols (`WebGLRenderer, Scene, PerspectiveCamera, SphereGeometry, RingGeometry, MeshPhysicalMaterial, PMREMGenerator`) plus `RoomEnvironment` from `three/addons`. Budget about 150 to 170 kB gzip, loaded in its own dynamic chunk after LCP.
- On 4G (about 9 Mbps), 150 kB is roughly 150 to 250 ms of transfer. On a mid-range Android, parse/eval of about 600 kB minified JS can take a few hundred ms. This is why worker placement or idle scheduling matters more than byte-shaving.

### Gaps
- No authoritative, current (r18x) gzip measurement of a minimal `WebGLRenderer` scene was found. The forum numbers are from older releases. Measure with `vite build` plus `rollup-plugin-visualizer` or bundlephobia.
- The exact three.js version that introduced `WebGLRenderer.compileAsync` was not verified from a primary source (a search snippet said r152+; background knowledge says r158).
- Browser/GPU coverage of `KHR_parallel_shader_compile` on Android (Mali/Adreno) was not verified.

## Adaptive quality and device tiering

### Takeaway
Cap DPR at `Math.min(devicePixelRatio, 2)`, and lower on weak tiers. Then run a rolling FPS monitor in drei-PerformanceMonitor style (250 ms samples, 10 iterations, 75% threshold) that steps a 0..1 quality factor by 0.1 and maps it to DPR, e.g. `0.5 + 1.5 * factor`. Seed the initial tier from `deviceMemory` (Chromium only), `hardwareConcurrency`, `saveData`/`effectiveType`, and WebGL availability.

### Cited Findings
- Recommended pixel ratio cap: `Math.min(window.devicePixelRatio, 2)`. Mobile budget is about 100 draw calls; "something like <100 draw calls and <100,000 vertices if you can". Keep 3 or fewer dynamic lights. — [Utsubo, 100 Three.js Tips (2026)](https://www.utsubo.com/blog/threejs-best-practices-100-tips)
- `mediump` precision can be "up to twice as fast and twice as power-efficient" on Adreno mobile GPUs. — [Utsubo, 100 Three.js Tips (2026)](https://www.utsubo.com/blog/threejs-best-practices-100-tips)
- drei `PerformanceMonitor` defaults: `ms` 250 (sample window), `iterations` 10, `threshold` 0.75 (share of iterations that must fall outside bounds), `flipflops` Infinity (incline/decline cycles before `onFallback`), `factor` 0.5, `step` 0.1. Bounds derive from the device refresh rate. Callbacks: `onIncline`, `onDecline`, `onChange`, `onFallback`, which receive `fps`, `factor`, `refreshrate`, `frames[]`, `averages[]`. — [drei docs, PerformanceMonitor](https://github.com/pmndrs/drei/blob/master/docs/performances/performance-monitor.mdx)
- Canonical DPR mapping: `onChange={({ factor }) => setDpr(Math.floor(0.5 + 1.5 * factor, 1))}` with `factor={1}`, which starts high and scales between 0.5 and 2. — [drei docs, PerformanceMonitor](https://github.com/pmndrs/drei/blob/master/docs/performances/performance-monitor.mdx)
- `navigator.deviceMemory` returns GiB coarsened to a power of two and clamped to implementation-defined bounds (for privacy). It is secure-context only, available in workers (`WorkerNavigator.deviceMemory`), and has **limited availability, not Baseline**. The related client hint is `Sec-CH-Device-Memory`. — [MDN, Navigator.deviceMemory](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/deviceMemory)
- Monitoring: `stats-gl` tracks FPS/CPU/GPU for both renderers (`trackGPU: true`). `renderer.info.render.calls` (WebGL) or `.drawCalls` (WebGPU), and `renderer.info.memory.geometries/textures`. — [Utsubo, 100 Three.js Tips (2026)](https://www.utsubo.com/blog/threejs-best-practices-100-tips)

### Inferences
- Vanilla (non-React) port of PerformanceMonitor for the hero:
  - Accumulate frame count in the rAF loop, and every 250 ms push the fps into a ring buffer of 10.
  - When full, if ≥75% of samples are below the lower bound, `factor -= 0.1`; if ≥75% are above the upper bound, `factor += 0.1`. Clamp to 0..1, and reset the buffer after each change (hysteresis).
  - Apply `renderer.setPixelRatio(Math.min(0.5 + 1.5 * factor, cap))`.
  - Allow at most about 3 flip-flops, then freeze, so the hero does not oscillate.
- Initial tier (heuristic, not a standard):
  - **Low** = `deviceMemory <= 2` or `hardwareConcurrency <= 4` or `saveData` or `effectiveType` in `2g`/`3g`. Show the poster only, or 3D at DPR 1 with no clearcoat/iridescence.
  - **Mid** = `deviceMemory 4`. DPR cap 1.5, clearcoat on, iridescence off.
  - **High** = otherwise. DPR cap 2 and full material.
  - When `deviceMemory` is undefined (Safari/Firefox), fall back to `hardwareConcurrency` plus runtime FPS monitoring.
- Also step down when the monitor declines: DPR first, then disable iridescence/sheen (recompiles the shader, so do it once), then the antialias-substitute and shadow plane. Keep geometry segments modest, e.g. sphere 64×48 and ring 128×1.
- Pause the monitor while the hero is offscreen or the tab is hidden. Otherwise throttled rAF would read as "slow" and wrongly downgrade.

### Gaps
- drei's exact default `bounds` function (e.g. `refreshrate > 90 ? [50, 90] : [50, 60]`) and the `AdaptiveDpr` / `AdaptiveEvents` / `regress` internals were not fetched. Verify on the drei docs.
- Browser list for `deviceMemory` (background knowledge: Chromium-only, clamped 0.25 to 8 in Chrome) was not shown by MDN in this fetch. Check the MDN compat table.
- `navigator.connection` (`saveData`, `effectiveType`) support was not verified. Background knowledge says Chromium-only, absent in Safari/Firefox.
- No source was fetched for detecting a failing WebGL context (`getContext('webgl2')` returning null, `failIfMajorPerformanceCaveat`) or for GPU tiering libraries (e.g. `detect-gpu`).

## Cheap pearl/ceramic look

### Takeaway
`MeshPhysicalMaterial` with an environment map gives a pearl/ceramic look. Its extra per-pixel cost applies only to features enabled with non-zero values, so clearcoat plus a little sheen or iridescence is affordable on one object. A procedural environment (`RoomEnvironment` through `PMREMGenerator`) costs zero downloads, and procedural geometry makes Draco/meshopt/KTX2 irrelevant unless textures are added.

### Cited Findings
- "`MeshPhysicalMaterial` has a higher performance cost, per pixel, than other three.js materials. Most effects are disabled by default, and add cost as they are enabled." And: "For best results, always specify an environment map when using this material." — [three.js docs, MeshPhysicalMaterial](https://threejs.org/docs/pages/MeshPhysicalMaterial.html)
- Relevant defaults, all effects off at 0:
  - `clearcoat` 0, `clearcoatRoughness` 0
  - `sheen` 0, `sheenRoughness` 1, `sheenColor` black
  - `iridescence` 0, `iridescenceIOR` 1.3, `iridescenceThicknessRange` [100, 400]
  - `transmission` 0, `ior` 1.5, `thickness` 0, `reflectivity` 0.5, `specularIntensity` 1, `anisotropy` 0, `dispersion` 0
  - — [three.js docs, MeshPhysicalMaterial](https://threejs.org/docs/pages/MeshPhysicalMaterial.html)
- r186 changes the physical shading: "Optimize multi-scattering energy compensation", "Optimize DFG LUT sampling", and energy conservation for diffuse and sheen. — [three.js releases](https://github.com/mrdoob/three.js/releases)
- Asset compression facts, only relevant if assets are added:
  - Draco: "~95% reduction in many cases".
  - Meshopt "decodes considerably faster than Draco" and is the default in `gltf-transform optimize`.
  - KTX2 textures use "4–8x less GPU memory" than decoded PNG/JPEG.
  - A single 4K texture is about 64 MiB VRAM, or about 85 MiB with mipmaps.
  - Quantized vertex attributes save 35 to 50%.
  - — [Utsubo, 100 Three.js Tips (2026)](https://www.utsubo.com/blog/threejs-best-practices-100-tips)
- Mobile shadow maps: 512 to 1024 px (desktop 1024 to 2048). `PCFSoftShadowMap` was removed in r186, since the default is now soft. — [Utsubo, 100 Three.js Tips (2026)](https://www.utsubo.com/blog/threejs-best-practices-100-tips)

### Inferences
- Pearl recipe, for the high tier:
  - Base `color` off-white warm, `roughness` about 0.25 to 0.35, `metalness` 0.
  - `clearcoat` 1, `clearcoatRoughness` about 0.1 (glaze).
  - `iridescence` about 0.2 to 0.4 with `iridescenceThicknessRange` about [200, 600] (nacre shift).
  - Optionally `sheen` about 0.2 with a pale `sheenColor`.
  - **Never enable `transmission`.** It forces an extra transmission render pass, the costliest feature for this use.
- Ceramic recipe: roughness about 0.4, `clearcoat` 0.6 to 1, no iridescence. It is cheaper and fits the mid tier.
- Low tier: `MeshStandardMaterial` with the same env map. Or keep the poster.
- Environment: `const pmrem = new PMREMGenerator(renderer); scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture; pmrem.dispose();`. This costs zero network bytes, one-time GPU work, and the result can be disposed on teardown.
- Ring: `RingGeometry` with UVs remapped radially and a tiny procedural band texture, e.g. a 256×1 `DataTexture` or canvas gradient with alpha. Draw it `side: DoubleSide`, `transparent: true`, `depthWrite: false`. No KTX2 is needed.
- Fake contact shadow or planet shadow on the ring: a static radial-gradient plane or baked alpha, not shadow maps. Real shadow maps on one object are wasted cost on mobile.
- Draco/meshopt/KTX2 matter only if a sculpted GLB or photo textures replace procedural geometry. Then prefer meshopt (faster decode) plus KTX2 (VRAM).

### Gaps
- `RoomEnvironment` / `PMREMGenerator` doc pages were not fetched this session. The usage above is standard three.js-examples code but unverified here.
- No benchmark was found quantifying the per-pixel cost of clearcoat vs iridescence vs sheen on mobile GPUs. Measure with `stats-gl` GPU timing.

## Memory management and lifecycle

### Takeaway
Track and `dispose()` every geometry, material, texture, PMREM target and render target you create. Watch `renderer.info.memory` to confirm the counts return to zero. On teardown, call `renderer.dispose()`, and optionally `forceContextLoss()`. Pause the loop when the hero is offscreen or the tab is hidden, and handle `webglcontextlost` by falling back to the poster.

### Cited Findings
- `renderer.info.memory.geometries` and `renderer.info.memory.textures` expose live GPU resource counts; "dispose aggressively" is the recommended practice. — [Utsubo, 100 Three.js Tips (2026)](https://www.utsubo.com/blog/threejs-best-practices-100-tips)
- r186 introduces an "async dispose" capability for renderers. r184 reuses `getArrayBufferAsync()` buffers (`ReadbackBuffer`), and r185 pools per-uniform update-range objects. — [three.js releases](https://github.com/mrdoob/three.js/releases)
- A single 4K texture is about 64 MiB VRAM, or about 85 MiB with mipmaps. This is why texture size dominates memory on phones. — [Utsubo, 100 Three.js Tips (2026)](https://www.utsubo.com/blog/threejs-best-practices-100-tips)

### Inferences
- Hero lifecycle checklist:
  - **Pause offscreen:** use an `IntersectionObserver` on the hero, then `renderer.setAnimationLoop(null)` or post "pause" to the worker.
  - **Pause when hidden:** on `visibilitychange` with `document.hidden`, do the same pause.
  - **Resume:** re-attach the loop and reset the FPS monitor buffer.
  - **Teardown:** on SPA route change, run `geometry.dispose()`, `material.dispose()`, each `texture.dispose()` (band texture, PMREM env `texture`), then `renderer.dispose()` and optionally `renderer.forceContextLoss()` to free the context immediately on mobile.
  - **Context loss:** listen to `webglcontextlost` on the canvas and `preventDefault()` so restore is possible. Show the poster again (crossfade back), and on `webglcontextrestored` rebuild or re-enter the idle init.
- Keep only one WebGL context for the whole site. Mobile browsers cap concurrent contexts and drop the oldest.
- With OffscreenCanvas in a worker, `worker.terminate()` after disposing tears everything down. Still dispose first, so GPU memory is released deterministically.

### Gaps
- The three.js manual "Cleanup" page (`ResourceTracker` pattern, what does or doesn't need disposal) returned 404. Verify at `https://threejs.org/manual/#en/cleanup`.
- MDN pages for `webglcontextlost` / `WEBGL_lose_context` / `forceContextLoss`, and for the Page Visibility API, were not fetched. The checklist above is from background knowledge.
- Per-browser limits on concurrent WebGL contexts (often cited as about 16) were not verified.
- The exact semantics of r186 "async dispose" were not read. Check the r186 release notes and PR before relying on it.
