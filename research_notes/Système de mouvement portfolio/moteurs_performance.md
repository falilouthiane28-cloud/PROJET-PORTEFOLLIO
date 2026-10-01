# Engines and performance: GSAP + ScrollTrigger, Motion (vanilla), Lenis, Three.js vs 2D OffscreenCanvas

Research date: 2026-10-01. Project context (from local package.json): `gsap ^3.15.0`, `lenis ^1.3.26`, Vite 8, no `motion`, no `three` (removed in commit 189ba37 after measurement). Audience includes mid-range Android on 4G.

Source-bias note: most Motion-vs-GSAP numbers come from motion.dev, which is the vendor of one of the two libraries. Treat its GSAP numbers and "GPU" claims as vendor marketing unless confirmed elsewhere.

## 1. Motion vanilla API: signatures, bundle size per import, WAAPI/hardware acceleration, mini vs hybrid

### Takeaway
Motion's vanilla API is small and modular (inView about 0.5 kB, mini animate about 2.3 to 2.6 kB, hybrid animate about 18 kB). Its hardware acceleration only applies when animating `transform`/`opacity`/`filter`/`clip-path` as full CSS strings through WAAPI; the convenient independent transforms (`x`, `y`, `scale`) are NOT accelerated.

### Cited Findings
- `animate()` has three forms: `animate(element|selector, keyframes, options)`, `animate(motionValue, target, options)`, and sequences `animate([[selector, props, opts], ...])`; sequences support `at` with labels, absolute times and relative offsets (`"+0.5"`, `"<-0.2"`) — [Motion animate docs](https://motion.dev/docs/animate)
- Two variants: mini (about "2.3kb", HTML/SVG style animations via native browser APIs) and hybrid (about "18kb", adds independent transforms, CSS variables, SVG paths, sequences, motion values) — [Motion animate docs](https://motion.dev/docs/animate). The comparison page states mini at 2.6 kB and full at 18 kB — [Motion vs GSAP](https://motion.dev/docs/gsap-vs-motion) (minor inconsistency between Motion's own pages, likely version drift).
- Animation types: tween, spring (physics `stiffness/damping/mass` or duration-based `bounce/visualDuration`, plus `velocity`, `restSpeed`, `restDelta`), inertia; `stagger()` distributes delays — [Motion animate docs](https://motion.dev/docs/animate)
- `scroll(callback | animation, options)` returns a cleanup function; options `container` (default window), `axis` ("y"), `target`, `offset` (default `["start start","end end"]`), `trackContentSize` (default false); "able to run animations with the ScrollTimeline API where possible for optimal hardware-accelerated performance"; listed at 5.1 kB — [Motion scroll docs](https://motion.dev/docs/scroll). The comparison page lists scroll as "+2.5kb" on top of animate — [Motion vs GSAP](https://motion.dev/docs/gsap-vs-motion) (figures differ; 5.1 kB is likely standalone, +2.5 kB incremental — unverified).
- `inView(selector|Element|Element[], callback, { root, margin, amount })`; callback gets `(element, IntersectionObserverEntry)` and may return a leave callback; returns a stop function; "just 0.5kb"; built on IntersectionObserver — [Motion inView docs](https://motion.dev/docs/inview)
- `hover(selector|element, (el, startEvent) => (endEvent) => {}, { passive: true, once: false })` returns a cancel function and filters fake hover events emulated on touch devices — [Motion hover docs](https://motion.dev/docs/hover)
- `press(selector|element, (el, event) => (endEvent, info) => {}, { passive, once })`: filters right-click / secondary pointers, `info.success` on end, and adds keyboard accessibility (focus + Enter) — [Motion press docs](https://motion.dev/docs/press)
- Hardware-accelerated via WAAPI: `transform` and `opacity` reliably; `filter`, `background-color`, `clip-path` gaining support. Independent transforms (`x`, `scale`) use CSS variables underneath and "are not accelerated"; use `transform: "translateX(100px) scale(2)"` for acceleration. Chrome previously did not accelerate percentage transforms like `translateX(100%)` — [Motion performance docs](https://motion.dev/docs/performance)
- Motion claims WAAPI animations keep running at 60/120fps "even as the website becomes unresponsive", and reports 2.5x faster than GSAP animating from unknown values and 6x faster between value types (vendor benchmark) — [Motion vs GSAP](https://motion.dev/docs/gsap-vs-motion)
- License: Motion is MIT — [Motion vs GSAP](https://motion.dev/docs/gsap-vs-motion)

### Inferences
- For this site, the only Motion imports that are cheap and add capability GSAP lacks are `inView` (0.5 kB), `hover`/`press` (gesture hygiene) and mini `animate` with full `transform` strings (WAAPI, off-main-thread). Hybrid animate (18 kB) mostly duplicates GSAP.
- The "runs while main thread is blocked" benefit only exists for compositor properties written as full strings; animations using `x/y/scale` shorthands behave like any rAF library.

### Gaps
- No official per-function gzip size for `hover()`/`press()` found; Motion's pages do not state whether the quoted kB are gzip or min (the scroll page says "minified"). Exact current `motion` npm version not confirmed (bundlephobia fetch returned no data).

## 2. GSAP 3.13+/3.15 state, ScrollTrigger performance, Lenis integration (touch, reduced motion)

### Takeaway
GSAP and every plugin (SplitText, MorphSVG, ScrollSmoother...) are free (Webflow); 3.15 (April 2026) is current. Use the documented Lenis bridge on GSAP's single ticker, keep ScrollTrigger refreshes cheap (`ignoreMobileResize`, avoid `pinReparent`, use `batch`), and rely on Lenis's default reduced-motion handling, leaving touch on native scroll (`syncTouch: false`).

### Cited Findings
- "GSAP is now free for everyone, thanks to Webflow's support", including SplitText, MorphSVG, ScrollSmoother and all plugins — [GSAP pricing](https://gsap.com/pricing/)
- The no-charge license is closed-source and restricts use in tools competing with Webflow; vendor-of-competitor framing — [Motion vs GSAP](https://motion.dev/docs/gsap-vs-motion) (not verified on gsap.com's license page)
- GSAP 3.14 released Dec 8, 2025 (MorphSVG `smooth`, `curveMode`) — [GSAP 3.14 blog](https://gsap.com/blog/3-14/)
- GSAP 3.15 released April 13, 2026; main feature `easeReverse` (replaces `yoyoEase`, backward compatible); no performance/ScrollTrigger changes announced — [GSAP 3.15 blog](https://gsap.com/blog/3-15/)
- `gsap.ticker` is one rAF heartbeat updating the global timeline; `ticker.add(callback(time, deltaTime, frame), once, prioritize)`; `lagSmoothing` default: if more than 500 ms between ticks, act as if 33 ms passed; `ticker.fps(n)` throttles — [GSAP ticker docs](https://gsap.com/docs/v3/GSAP/gsap.ticker/)
- ScrollTrigger computes start/end up front then "only watches the scroll position", debounced and synced with rAF; resize refresh waits for a 200 ms gap; `ScrollTrigger.config({ ignoreMobileResize })` avoids recalculating on mobile address-bar resize; `ScrollTrigger.batch()` groups callbacks for many elements; pin wraps in a pin-spacer; `pinReparent: true` is "expensive"; `pinSpacing: false|"margin"` options; `fastScrollEnd` (default 2500 px/s) completes animations on fast scroll; `normalizeScroll()` moves scrolling to the JS thread to stop address-bar show/hide — [ScrollTrigger docs](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
- Lenis current version 1.3.26; "a few KB", zero dependencies; runs on native scroll (keeps `position: sticky`, anchors); lenis.css recommended — [Lenis README](https://github.com/darkroomengineering/lenis)
- Official GSAP bridge: `lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add((time) => { lenis.raf(time * 1000); }); gsap.ticker.lagSmoothing(0);` — [Lenis README](https://raw.githubusercontent.com/darkroomengineering/lenis/main/README.md)
- Options: `autoRaf` default false, `anchors` default false, `prevent` function, `syncTouch` default false (touch keeps native scroll); `syncTouch` "can be unstable on iOS<16"; touch multiplier default 1 — [Lenis README](https://github.com/darkroomengineering/lenis)
- "By default, Lenis honors the user's prefers-reduced-motion setting: when it is set to reduce, smoothing is disabled and programmatic scrolls jump instantly", exposed as `lenis.prefersReducedMotion` — [Lenis README](https://raw.githubusercontent.com/darkroomengineering/lenis/main/README.md)
- Limitations: no CSS scroll-snap (use lenis/snap), capped at 60fps on Safari and 30fps in low power mode, no wheel over iframes, fixed elements may lag on pre-M1 macOS Safari — [Lenis README](https://raw.githubusercontent.com/darkroomengineering/lenis/main/README.md)

### Inferences
- With Lenis driven from `gsap.ticker`, there is one rAF loop for GSAP+Lenis. `lagSmoothing(0)` is required so scroll position and tweens do not desync after a long frame, but it means a long task produces a visible jump rather than a slowdown.
- On Android touch, Lenis with `syncTouch: false` adds essentially nothing but listener cost; the scroll is native, so ScrollTrigger works as without Lenis. Consider not instantiating Lenis at all on `(pointer: coarse)` to save its JS evaluation.
- The reduced-motion default in Lenis does not cover GSAP tweens; `gsap.matchMedia()` (not fetched in this session) is the usual tool.

### Gaps
- Exact gzip sizes of gsap core / ScrollTrigger / SplitText from a neutral source not obtained (only motion.dev's: core 23 to 23.5 kB, ScrollTrigger +12 kB). Recommend measuring with the project's own `npm run analyze` (rollup-plugin-visualizer).
- Exact release version that made GSAP free (widely reported as 3.13, spring 2025) not confirmed on a fetched page.
- Whether `normalizeScroll()` conflicts with Lenis not checked; standard advice is not to combine them (unverified).

## 3. Risks of running both engines and recommended split

### Takeaway
The real risk is two writers on the same element's `transform` (or same property); two rAF loops are a secondary cost. Rule: one engine owns an element/property; GSAP owns scroll scenes, timelines, hero intro and text splitting; Motion (if added) only owns isolated micro-interactions on separate elements.

### Cited Findings
- Failure mode: GSAP sets an inline transform and Motion overwrites it next frame; rule "one library owns one element", common split is Motion for UI state/gestures and GSAP for hero, scroll scenes, SVG/text — [OpenReplay: Motion vs GSAP](https://blog.openreplay.com/motion-vs-gsap/) (secondary blog, consistent with GSAP forum threads)
- GSAP community threads on combining separate transforms on one element recommend nesting wrappers or a single owner — [GSAP forum: two separate transforms](https://gsap.com/community/forums/topic/18947-two-separate-transforms-simultaneously/)
- Motion independent transforms are implemented via CSS variables composited into `transform` — [Motion performance docs](https://motion.dev/docs/performance); GSAP writes the whole inline `transform` from its own cached values, so any outside write to `transform` gets clobbered — [GSAP forum: MotionPath and regular transform](https://gsap.com/community/forums/topic/23011-motionpath-and-regular-transform-issue/)
- GSAP runs all its work in one ticker rAF — [GSAP ticker](https://gsap.com/docs/v3/GSAP/gsap.ticker/); Motion's WAAPI animations run on the compositor — [Motion performance docs](https://motion.dev/docs/performance)

### Inferences
- Concrete conflict-avoidance rules: (a) wrapper elements when both need transforms (outer = GSAP scroll parallax, inner = Motion hover scale); (b) never let both touch `opacity` on the same node; (c) GSAP `gsap.set` / `clearProps` after a Motion WAAPI animation can leave a committed WAAPI style; prefer separate nodes; (d) Lenis stays on GSAP's ticker, Motion's own frameloop runs only while its JS-driven animations are active.

### Gaps
- No primary benchmark of the CPU cost of two concurrent rAF loops on low-end Android found.

## 4. Is Motion worth adding next to GSAP? Can CSS scroll-driven animations / View Transitions replace parts? Support 2026

### Takeaway
For this vanilla static site already carrying GSAP + ScrollTrigger + Lenis, Motion's hybrid build is redundant weight; at most `inView` + `hover`/`press` + mini `animate` (about 3 to 4 kB total by Motion's own figures) can be justified. CSS scroll-driven animations are now in Chrome, Edge, Safari 26 and Samsung Internet and can take over simple reveal/progress effects with `@supports` fallback.

### Cited Findings
- Motion vendor size figures: mini 2.3 to 2.6 kB, hybrid 18 kB, inView 0.5 kB, scroll 5.1 kB (or +2.5 kB) vs GSAP core about 23 kB and ScrollTrigger about +12 kB — [Motion vs GSAP](https://motion.dev/docs/gsap-vs-motion), [Motion inView](https://motion.dev/docs/inview), [Motion scroll](https://motion.dev/docs/scroll)
- GSAP lacks spring easing; Motion lacks timeline mutation after playback — [Motion vs GSAP](https://motion.dev/docs/gsap-vs-motion)
- `animation-timeline: scroll()` support per caniuse: Chrome/Edge 115+, Safari and iOS Safari 26.0+, Samsung Internet 23+, Firefox listed as 160+, global usage 87.22% — [caniuse animation-timeline scroll](https://caniuse.com/mdn-css_properties_animation-timeline_scroll)
- MDN still marks `animation-timeline` "Limited availability", not Baseline — [MDN animation-timeline](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline)
- Safari 26.0 shipped scroll-driven animations (Sept 2025), threaded scroll-driven animations in 26.4, bug fixes in 26.5 (secondary summary) — [WebKit: Safari 26.0 features](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/), [WebKit scroll-driven guide](https://webkit.org/blog/17101/a-guide-to-scroll-driven-animations-with-just-css/)
- View Transitions: Safari scored 99.2% in Interop 2025; Interop 2026 adds cross-document view transitions as a focus area — [WebKit: Announcing Interop 2026](https://webkit.org/blog/17818/announcing-interop-2026/)

### Inferences
- West African Android traffic is overwhelmingly Chromium (Chrome, Samsung Internet); both support CSS scroll-driven animations, so CSS `view()` timelines can replace ScrollTrigger for simple fade/translate reveals, running off the main thread, with a static final state as fallback (`@supports not (animation-timeline: view())`).
- Keep GSAP/ScrollTrigger for pinned scenes, scrubbed timelines driving canvas/worker, and SplitText; these are not expressible in pure CSS.
- View Transitions are mostly relevant for multi-page navigation; on a one-page static site their value is limited to state changes (e.g. theme toggle, filter).

### Gaps
- caniuse's "Firefox 160+" and "Chrome Android 154+" look like caniuse's convention of only listing the newest tracked version (or a future/flagged release); not verified against Firefox release notes. Firefox share in the target region is low, so impact is small.
- No neutral 2026 measurement of Motion vs GSAP INP on low-end Android found.

## 5. Three.js hero best practices vs 2D canvas in an OffscreenCanvas worker

### Takeaway
Three.js costs roughly 150 kB min+gzip and tree-shakes poorly; best practices (lazy import, DPR cap, render on demand, Draco/meshopt, compressed textures, few draw calls) reduce runtime but not that download. For a 4G mid-range Android audience, the site's existing decision (2D canvas in an OffscreenCanvas worker, three removed after measurement) is well-supported.

### Cited Findings
- three.js approximate min+gzip about 150 kB; tree-shaking is limited (one app went 773 kB to 590 kB minified with an aggressive tree-shake tool) — [mattdesl/threejs-tree-shake](https://github.com/mattdesl/threejs-tree-shake), [three.js forum: bloated js file](https://discourse.threejs.org/t/bloated-js-file/16176) (secondary; exact figure for the current r17x release not confirmed)
- Render on demand ("only rendering when the camera position changes ... or when an animation happens"); cap pixel ratio (devices up to 5, "consider limiting the max pixel ratio to 2 or 3"); Draco can reduce glTF "to less than 10% of their original size", gltfpack (meshopt) as alternative; fewer draw calls / instancing; built-in MSAA is cheap on mobile, FXAA post-process costly; keep frustum small; prefer toggling visibility over remove/re-add — [Discover three.js tips](https://discoverthreejs.com/tips-and-tricks/)
- (Official three.js manual dispose page URL returned 404 at fetch time; manual content not re-verified.)

### Inferences
- If 3D ever returns: dynamic `import('three')` after first paint/idle and only on capable devices (e.g. `navigator.hardwareConcurrency`, `deviceMemory`, `matchMedia('(prefers-reduced-motion)')`), `renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))` on mobile, pause via IntersectionObserver + `visibilitychange`, dispose geometries/materials/textures/render targets on teardown, KTX2/Basis textures and meshopt/Draco geometry.
- A 2D canvas worker avoids the ~150 kB parse/compile on the main thread and keeps drawing off the main thread, which directly helps TBT/INP; three can also run in an OffscreenCanvas worker, but the download cost remains.

### Gaps
- Current three.js version and exact gzip size not obtained (bundlephobia page returned no data). OffscreenCanvas support table not fetched in this session.

## 6. INP/TBT impact of animation libraries

### Takeaway
Libraries hurt INP/TBT mainly through script evaluation at load and through main-thread work (layout reads/writes) during interactions; compositor-only properties and smaller, deferred bundles are the levers.

### Cited Findings
- Good INP is 200 ms or less at p75; script evaluation (parse, compile, execute) at load creates long tasks that delay interaction handling; avoid writing styles then reading layout in the same task; yield often (e.g. `setTimeout` inside rAF for non-critical work); large DOM updates increase presentation delay; `content-visibility` for off-screen content (updated Sept 2, 2025) — [web.dev Optimize INP](https://web.dev/articles/optimize-inp)
- Animate only `transform` and `opacity` for compositor-only work; `top/left` animation dropped about 50% of frames vs about 1% with transform in web.dev's example; use `will-change` sparingly, only when issues are seen (2020 article) — [web.dev animations guide](https://web.dev/articles/animations-guide)
- WAAPI compositor animations keep running when the main thread is busy (vendor claim) — [Motion performance docs](https://motion.dev/docs/performance)
- ScrollTrigger pre-computes positions and only watches scroll, but every refresh re-measures; `ignoreMobileResize` avoids refreshes from mobile address bar — [ScrollTrigger docs](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)

### Inferences
- Practical levers: code-split GSAP plugins not needed above the fold; init ScrollTriggers after first interaction-ready idle; never call `ScrollTrigger.refresh()` in input handlers; keep pointer handlers to writing values that the ticker consumes (as the current hero already does with smoothed pointer).
- Adding Motion hybrid (about 18 kB) would add evaluation cost with little new capability; mini/inView are negligible.

### Gaps
- No field data (CrUX) comparing sites with GSAP vs Motion vs CSS-only found.
