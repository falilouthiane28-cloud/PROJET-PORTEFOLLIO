# GSAP + ScrollTrigger + Lenis performance on production marketing sites (mid-range Android, 4G)

_Researched 2026-09-30. Tool budget was capped at about 15 calls, so some sub-questions (quickTo, will-change, Vite modulepreload, font subsetting) could not be verified against primary sources this session; they are flagged in Gaps or marked "unverified" in Inferences._

## Q1. Recommended Lenis + ScrollTrigger integration and its caveats (touch/syncTouch, anchors, reduced motion, refresh)

### Takeaway
Drive Lenis from GSAP's ticker (autoRaf off), push every Lenis scroll event into `ScrollTrigger.update`, and disable GSAP lag smoothing. By default Lenis does not smooth touch input (`syncTouch: false`), so mid-range Android phones keep native, compositor-driven scrolling. That is the cheapest and least janky option and should be kept. Anchors, reduced motion, and refresh after layout changes need explicit handling.

### Cited Findings
- Latest Lenis per the README and Bundlephobia: 1.3.26. — [Lenis README](https://github.com/darkroomengineering/lenis); [Bundlephobia](https://bundlephobia.com/api/size?package=lenis)
- Official GSAP integration snippet from the Lenis README:
  ```js
  const lenis = new Lenis();
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => { lenis.raf(time * 1000); });
  gsap.ticker.lagSmoothing(0);
  ```
  — [Lenis README](https://github.com/darkroomengineering/lenis)
- Constructor defaults: `autoRaf: false`, `autoResize: true`, `autoToggle: false`, `lerp: 0.1`, `duration: 1.2`, `smoothWheel: true`, `syncTouch: false`, `syncTouchLerp: 0.075`, `touchMultiplier: 1`, `wheelMultiplier: 1`, `anchors: false` (boolean or ScrollToOptions), `allowNestedScroll: false`, `prevent: undefined`, `respectReducedMotion: true`, `stopInertiaOnNavigate: false`, `overscroll: true`, `naiveDimensions: false`, `infinite: false`, `wrapper: window`, `content: document.documentElement`. — [Lenis README](https://github.com/darkroomengineering/lenis)
- Touch: `syncTouch` "may produce unexpected behavior" on iOS < 16. `syncTouch: true` is required for infinite scroll on touch devices. — [Lenis README](https://github.com/darkroomengineering/lenis)
- Anchors: `anchors: true` enables in-page link navigation through Lenis and accepts offset and callback options. Nested scroll areas use `allowNestedScroll: true` or a `data-lenis-prevent` attribute. — [Lenis README](https://github.com/darkroomengineering/lenis)
- Reduced motion: the README (as summarized by the fetch) says Lenis respects `prefers-reduced-motion` by default through `respectReducedMotion: true` and disables smoothing. — [Lenis README](https://github.com/darkroomengineering/lenis) (see Gaps: verify against the installed version's source)
- Recommended CSS: `import 'lenis/dist/lenis.css'`, which normalizes scroll behaviour. — [Lenis README](https://github.com/darkroomengineering/lenis)
- Lenis limitations: no native CSS scroll-snap (needs the `lenis/snap` package), capped at 60fps on Safari and 30fps in low-power mode, smoothing disabled inside iframes, possible lag on fixed elements in pre-M1 macOS Safari. — [Lenis README](https://github.com/darkroomengineering/lenis)
- ScrollTrigger re-computes all start/end positions on viewport resize and "waits until there's a 200ms gap in resize events before starting its work". Scroll events are debounced and synced with requestAnimationFrame. — [ScrollTrigger docs](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
- `ScrollTrigger.normalizeScroll()` "forces scrolling to be done on the JavaScript thread, ensuring screen updates are synchronized and the address bar doesn't show/hide on [most] mobile devices." `scrollerProxy()` integrates third-party smooth scrollers. — [ScrollTrigger docs](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
- Official "common mistakes" guidance:
  - Call `ScrollTrigger.refresh()` after dynamically loaded content changes layout.
  - Use function-based `start`/`end` values plus `invalidateOnRefresh: true` for anything that depends on the viewport.
  - Create ScrollTriggers in scroll order, or use `refreshPriority`, when pinning.
  - Don't put ScrollTriggers on tweens nested inside a timeline.
  - Set `html { scroll-behavior: auto !important; }`, because CSS smooth scrolling misaligns refresh.
  - Use `start: "clamp(top bottom)"` to stop scrub jumps on load.
  - Kill and recreate ScrollTriggers on SPA route changes.

  — [GSAP: ScrollTrigger mistakes](https://gsap.com/resources/st-mistakes/)
- `fastScrollEnd` forces an animation to complete if the user leaves its trigger area faster than a velocity threshold. `preventOverlaps` completes earlier animations to avoid overlap during fast scrolling. — [ScrollTrigger docs](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)

### Inferences
- Keep `autoRaf: false` (the default) when using `gsap.ticker.add(...)`. Enabling both would run two rAF loops calling `lenis.raf`.
- On Android, leave `syncTouch: false`. Touch then scrolls natively (compositor thread) and Lenis only relays scroll events to ScrollTrigger, which avoids main-thread-driven scrolling during long tasks. That matters on 4G mid-range phones where hydration and third-party JS compete for the main thread. For the same reason, avoid `ScrollTrigger.normalizeScroll()` unless an address-bar resize bug makes it necessary: it moves scrolling onto the JS thread.
- `gsap.ticker.lagSmoothing(0)` keeps Lenis and ScrollTrigger in lock-step after a long frame, but it also means a 300 ms long task produces a visible jump rather than a slowed-down catch-up. Minimizing long tasks during the intro (see Q4) is what keeps it smooth.
- Anchors: either set `anchors: true` (optionally with an `offset` for a fixed header) or intercept clicks and call `lenis.scrollTo(target)`. Otherwise native hash jumps bypass Lenis's internal position.
- Refresh triggers worth wiring in:
  - `document.fonts.ready.then(() => ScrollTrigger.refresh())`, because web-font swaps change text heights.
  - Refresh after lazy images without explicit dimensions load. Better still, give every image width/height or aspect-ratio so no refresh is needed.
  - Rely on ScrollTrigger's built-in debounced resize handling rather than adding your own.
- Reduced motion: even if Lenis handles it internally, gate construction explicitly for robustness, e.g. `if (!matchMedia('(prefers-reduced-motion: reduce)').matches) { new Lenis(...) }`. Put all GSAP choreography inside `gsap.matchMedia()` with a `reduceMotion` condition (see Q3).

### Gaps
- Could not confirm from Lenis source that `respectReducedMotion` exists with default `true` in 1.3.26. The value comes from a model summary of the README and should be verified in `node_modules/lenis/dist/*.d.ts` before relying on it.
- No primary-source benchmark of Lenis vs. native scroll on mid-range Android was found.
- ScrollTrigger.config defaults (`limitCallbacks`, `ignoreMobileResize`, `autoRefreshEvents`) were not extracted. The fetched docs page only named `limitCallbacks`. Check https://gsap.com/docs/v3/Plugins/ScrollTrigger/static.config()/.

## Q2. Current bundle sizes (gzip) and GSAP licensing after Webflow

### Takeaway
GSAP core is about 27 KB gzip (3.15.0), Lenis about 5.5 KB gzip (1.3.26), and ScrollTrigger an estimated ~17 KB gzip (44.6 KB minified), for roughly 50 KB gzip in total. GSAP, including all formerly paid plugins, is free for commercial use under the "Standard No Charge" license. The one restriction bars tools that compete with Webflow's visual animation builder.

### Cited Findings
- `gsap` 3.15.0 npm main entry: 70,605 B minified, 27,350 B gzip, 0 dependencies. — [Bundlephobia API](https://bundlephobia.com/api/size?package=gsap)
- `lenis` 1.3.26: 18,816 B minified, 5,473 B gzip, 0 dependencies. — [Bundlephobia API](https://bundlephobia.com/api/size?package=lenis)
- gsap 3.15.0 dist files (minified, uncompressed), per jsDelivr:

  | File | Size |
  |---|---|
  | gsap.min.js | 72,927 B |
  | ScrollTrigger.min.js | 44,575 B |
  | ScrollSmoother.min.js | 13,373 B |
  | Observer.min.js | 10,014 B |
  | SplitText.min.js | 7,732 B |

  — [jsDelivr package data](https://data.jsdelivr.com/v1/packages/npm/gsap@3.15.0?structure=flat)
- Lenis describes itself as "a few KB with zero runtime dependencies". — [Lenis README](https://github.com/darkroomengineering/lenis)
- "GSAP is now 100% free for all users, thanks to Webflow's support." The free offering lists SplitText, MorphSVG, ScrollSmoother, DrawSVG, and others. — [GSAP pricing](https://gsap.com/pricing/)
- The Standard License FAQ says "Commercial usage is covered under the standard license" and that all of GSAP, including the formerly members-only plugins, "can be used in commercial projects at no charge". — [GSAP Standard License](https://gsap.com/community/standard-license/)
- Restriction: GSAP may not be used in "Competitive Products" that let users "create, edit, or manage animations through a visual interface or builder similar to Webflow". The FAQ also says "AI-generated code is not a 'Prohibited Use'". — [GSAP Standard License](https://gsap.com/community/standard-license/)

### Inferences
- The ScrollTrigger gzip size (~17 KB) is an estimate. It applies gsap's measured ratio (70,605 → 27,350, about 2.58:1) to 44,575 B. Measure it in the actual build with `vite build` plus `rollup-plugin-visualizer` or `npx vite-bundle-visualizer`.
- About 50 KB gzip of animation JS, parsed and compiled on a mid-range Android phone, is modest but not free. Load it as a separate chunk (dynamic `import('gsap')`) after the hero's first paint, not in the render-critical path. The hero must be readable without JS (see Q4).
- ScrollSmoother is now free, but it duplicates Lenis. Pick one smoother. Lenis is smaller (~5.5 KB gzip vs. 13.4 KB minified for ScrollSmoother).

### Gaps
- No primary-source gzip figure for `ScrollTrigger.min.js`. Bundlephobia does not measure sub-path imports, and downloading files to measure them was out of scope.
- The date of the licensing change was not on the fetched pages. It is widely reported as spring 2025 but was not verified here.

## Q3. Best practices: ScrollTrigger.batch, quickTo, will-change, avoiding layout reads, gsap.matchMedia

### Takeaway
Use `ScrollTrigger.batch()` for repeated reveal elements instead of one ScrollTrigger per element with separate callbacks. Use `gsap.matchMedia()` with a `reduceMotion` condition so every animation and ScrollTrigger is reverted automatically when a query stops matching. Animate only `transform` and `opacity`, and never read layout inside `onUpdate`.

### Cited Findings
- `ScrollTrigger.batch()` "creates a coordinated group of ScrollTriggers (one for each target element) that batch their callbacks (onEnter, onLeave, etc.) within a certain interval". — [ScrollTrigger docs](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
- `gsap.matchMedia()` runs setup code only while a query matches. When it stops matching, "all the GSAP animations and ScrollTriggers created during that function's execution get reverted automatically". It creates a `gsap.context()` internally, so wrapping it in another context is redundant. — [gsap.matchMedia docs](https://gsap.com/docs/v3/GSAP/gsap.matchMedia()/)
- Official conditions pattern:
  ```js
  mm.add({
    isDesktop: "(min-width: 800px)",
    isMobile: "(max-width: 799px)",
    reduceMotion: "(prefers-reduced-motion: reduce)",
  }, (context) => {
    let { isDesktop, isMobile, reduceMotion } = context.conditions;
    gsap.to(".box", { rotation: isDesktop ? 360 : 180, duration: reduceMotion ? 0 : 2 });
  });
  ```
  — [gsap.matchMedia docs](https://gsap.com/docs/v3/GSAP/gsap.matchMedia()/)
- ScrollTrigger caches starting values at creation, so animating the same property from several ScrollTriggers causes jumps. Fixes: `immediateRender: false`, `.fromTo()`, or a single timeline with one ScrollTrigger. — [GSAP: ScrollTrigger mistakes](https://gsap.com/resources/st-mistakes/)
- To make a scrubbed animation longer, lengthen `end` (e.g. `"+=600"`). Changing `duration` has no effect under scrub. — [GSAP: ScrollTrigger mistakes](https://gsap.com/resources/st-mistakes/)

### Inferences (partly from prior knowledge; not re-verified this session)
- Unverified: `gsap.quickTo(target, prop, {duration, ease})` returns a reusable function that re-targets one tween instead of creating a new tween per `pointermove`. It is the recommended pattern for cursor followers. Pair it with transform properties (`x`, `y`) only. See https://gsap.com/docs/v3/GSAP/gsap.quickTo()/.
- Disable pointer-following effects on touch/coarse pointers through a `gsap.matchMedia()` condition such as `"(hover: hover) and (pointer: fine)"`. Mid-range Android gets no benefit from them.
- `will-change: transform` should be applied only during an animation, or on a small number of persistently animated layers. Each promoted layer costs GPU memory, which is limited on mid-range Android. GSAP already uses 3D transforms (`force3D: "auto"`) during tweens, so blanket CSS `will-change` on many elements is counter-productive.
- In `onUpdate` and `onToggle` callbacks, use the values ScrollTrigger passes in (`self.progress`, `self.direction`, `self.getVelocity()`) instead of calling `getBoundingClientRect()`/`offsetTop`. Interleaving layout reads with style writes every frame forces synchronous layout (layout thrash). Precompute measurements in function-based `start`/`end` values, which re-run only on refresh.
- Prefer `scrub: true` or a small numeric scrub (e.g. `0.5`). Prefer `toggleActions` or batch callbacks over per-frame JS for simple reveals.

### Gaps
- The quickTo, will-change and force3D pages were not fetched this session because of the tool budget. Treat the related Inferences as unverified.
- No quantitative data found on the per-ScrollTrigger cost on low-end devices.

## Q4. Keeping LCP fast when the hero headline is revealed by JS; how Chrome treats animated elements

### Takeaway
Since Chrome 86, LCP ignores paints at opacity 0, and since Chrome 130 transparent text is not LCP-eligible. A hero headline that starts at `opacity: 0` and waits for GSAP (downloaded over 4G, parsed, executed) therefore gets its LCP pushed to the moment the JS reveal paints it. The fix is to render the headline visible in the first paint without JS: start at a non-zero opacity or animate transform/clip only, and keep GSAP out of the critical path.

### Cited Findings
- Chromium LCP changelog: Chrome 86 "Largest Contentful Paint ignores paints with opacity 0". Chrome 88 ignores removed content by default. Chrome 116 changed handling of videos and animated images. Chrome 130 "Exclude transparent text from being LCP eligible". Chrome 144 "Corrected LCP and FCP handling when document opacity changes from zero to non-zero". — [Chromium LCP metrics changelog](https://chromium.googlesource.com/chromium/src/+/main/docs/speed/metrics_changelog/lcp.md)
- DebugBear says Chrome does not count `opacity: 0` elements as LCP candidates and records LCP only once the element is repainted at visible opacity. It also claims a faded-in element does not become a candidate unless repainted, and that if it is repainted, LCP is later than expected. Its practical fixes are a minimum starting opacity such as `0.1` (nearly invisible, yet counted on the initial paint) or not fading the LCP element at all. — [DebugBear: opacity animations and LCP](https://www.debugbear.com/blog/opacity-animation-poor-lcp)
- Anecdotal field report: a GitHub PR titled "Homepage hero: eyebrow + headline slide in without fading (phone LCP 3.5 s → 2.1 s on a slow phone)". — [GitHub PR, figurepinner-site #73](https://github.com/bubs960/figurepinner-site/pull/73) (single project, low authority; cited only as an illustration)

### Inferences
- Recommended pattern for a JS-animated hero on 4G Android:
  1. The server-rendered HTML contains the headline fully visible in CSS (no `opacity:0` in the stylesheet or `visibility:hidden` gating on a JS class).
  2. Any "pre-animation" state is applied only in a `gsap.from()` executed after GSAP loads, or through a class added by a tiny inline script. Even then, animate `transform` (e.g. `yPercent`) or `clip-path`/mask reveals while leaving opacity ≥ 0.1.
  3. Consider skipping the intro entirely if JS arrives late, e.g. when `performance.now()` exceeds about 1–1.5 s at GSAP init. This avoids a visible "flash then animate" and a late LCP.
- Based on the changelog wording, transform- or clip-path-only reveals do not appear to disqualify an element from LCP the way opacity 0 and transparent text do. This is not confirmed by a primary source (see Gaps).
- The Chrome 144 fix for document opacity 0 → non-zero is relevant to "page curtain" intros that fade the whole `<html>`/`<body>`. Older Chrome versions still in the field may report LCP differently, so avoid whole-document opacity curtains.
- A preloader or "curtain" overlay that covers the hero until an intro timeline finishes delays LCP and likely hurts INP/TBT (the main thread is busy during the intro). Prefer a non-blocking intro that plays over already-visible content.

### Gaps
- No primary Chrome/web.dev source was fetched on how `transform: scale()`/`translate` or `clip-path: inset(100%)` affect LCP candidate size and eligibility. The Chromium changelog has no entries on transforms or clip-path. Test empirically with the Performance panel or the `web-vitals` library `attribution` build (`element`, `renderDelay`).
- DebugBear's claim that "a faded-in element doesn't become a candidate unless repainted" conflicts somewhat with the general reading of the Chrome 86 change, where a later visible paint becomes the candidate. The difference likely depends on whether the opacity animation is compositor-only (no repaint). Flagged as unresolved.
- web.dev's LCP sub-parts article (element render delay) and INP/TBT guidance for intro animations were not fetched because of the tool budget.

## Q5. Self-hosting variable WOFF2 fonts with subsetting and fallback metric overrides to avoid CLS

### Takeaway
Self-host a subsetted variable WOFF2 and preload only the one file used above the fold. Declare a local fallback `@font-face` (e.g. Arial) with `size-adjust`, `ascent-override`, `descent-override` and `line-gap-override` computed from the web font's metrics, so the swap causes near-zero layout shift. Tools like Fontaine, Capsize or next/font generate these values.

### Cited Findings
- Descriptors: `size-adjust` "proportionally scales the width and height of font glyphs". `ascent-override`, `descent-override` and `line-gap-override` override the vertical metrics. — [Chrome for Developers: Improved font fallbacks](https://developer.chrome.com/blog/font-fallbacks)
- Formulas with size-adjust:
  - `size-adjust = avgCharWidth(web font) / avgCharWidth(fallback)`
  - `ascent-override = ascent / (UPM × size-adjust)`
  - The same pattern applies to `descent-override` and `line-gap-override`.

  — [Chrome for Developers: Improved font fallbacks](https://developer.chrome.com/blog/font-fallbacks)
- Worked example (Poppins over Arial):
  ```css
  @font-face {
    font-family: "fallback for poppins";
    src: local("Arial");
    size-adjust: 60.85099821%;
    ascent-override: 164.3358416%;
    descent-override: 57.51754455%;
    line-gap-override: 16.43358416%;
  }
  ```
  — [Chrome for Developers: Improved font fallbacks](https://developer.chrome.com/blog/font-fallbacks)
- Tooling: `@next/font` (Next 13+) and `@nuxtjs/fontaine` apply overrides automatically. Standalone tools are Fontaine, Capsize and fontdrop.info. Matching fallback metrics "reduce or eliminate layout shifts caused by font swapping". — [Chrome for Developers: Improved font fallbacks](https://developer.chrome.com/blog/font-fallbacks)

### Inferences (partly from prior knowledge; not re-verified this session)
- For a Vite/vanilla site, the Fontaine Vite/Rollup plugin (`fontaine` on npm) can generate the fallback `@font-face` at build time. Alternatively compute the values once with Capsize's metrics and hard-code them.
- Unverified: subset with `pyftsubset` (fonttools) or `glyphhanger` to the needed Unicode ranges (e.g. Latin + Latin-1 Supplement for French), keep the variable axes you use (`wght` only if possible), and output `--flavor=woff2`. Declare `unicode-range` on the `@font-face`.
- Unverified: preload only the hero font with `<link rel="preload" as="font" type="font/woff2" crossorigin>`. Use `font-display: swap` (with metric-matched fallback) or `optional` (no swap at all on slow 4G loads).
- After fonts load, call `ScrollTrigger.refresh()` (via `document.fonts.ready`) so trigger positions match the final text metrics (see Q1).
- If the headline is split with SplitText, run the split after `document.fonts.ready`. Splitting while the fallback is displayed yields wrong line breaks after the swap. SplitText is now free (see Q2).

### Gaps
- web.dev's font best-practices article, Vite `modulepreload`/dynamic-import docs, and a primary source on subsetting tools were not fetched because of the tool budget.
- No data found on typical CLS contribution from unmatched font swaps on mid-range Android.
