# Motion design for a premium hero: Apple product pages and Awwwards-level sites

## 1. Intro timeline: durations, sequencing, and acceptable total length

### Takeaway
No authoritative source publishes a canonical "preloader → object → headline → subtitle → CTA → nav" timeline. The defensible constraints are that each element's motion takes 100–500 ms (NN/g), that feedback lands within 100 ms and attention drops past about 1 s (RAIL), and that people should never wait on an animation (Apple HIG). So a hero intro should overlap its steps and keep essential content visible and usable within about 1 s.

### Cited Findings
- Recommended range for most UI animations is 100–500 ms. Simple feedback (toggle, checkbox) takes about 100 ms, and substantial screen changes such as a modal entering take 200–300 ms — [NN/g, Animation Duration](https://www.nngroup.com/articles/animation-duration/)
- "At 500ms, animations start to feel like a real drag for users." A duration of 400 ms is kept for large movements across big screens — [NN/g](https://www.nngroup.com/articles/animation-duration/)
- Exits should be shorter than entrances. NN/g's example is a popup that takes 300 ms to appear and 200–250 ms to disappear — [NN/g](https://www.nngroup.com/articles/animation-duration/)
- RAIL perception bands: 0–16 ms feels smooth (60 fps), 0–100 ms feels immediate, 100–1000 ms reads as "natural and continuous progression", 1000 ms+ means "users lose focus", and 10000 ms+ means users are "likely to abandon" — [web.dev, RAIL](https://web.dev/articles/rail)
- RAIL frame budget: produce each frame in 10 ms or less (the hard ceiling is 16 ms, and the browser needs about 6 ms). Load and become interactive in 5 s or less on mid-range mobile over slow 3G, and under 2 s on repeat loads — [web.dev, RAIL](https://web.dev/articles/rail)
- Apple HIG: "Let people cancel motion… don't make people wait for an animation to complete before they can do anything, especially if they have to experience the animation more than once." — [Apple HIG, Motion](https://developer.apple.com/design/human-interface-guidelines/motion)
- Apple HIG: "Don't add motion for the sake of adding motion. Gratuitous or excessive animation can distract people and may make them feel disconnected or physically uncomfortable." — [Apple HIG, Motion](https://developer.apple.com/design/human-interface-guidelines/motion)
- Codrops 2025–2026 hero and intro articles describe a single GSAP timeline in which an image slides in, text splits and reveals line by line, and supporting content then fades in. They also describe preloading "racing" the fade-out, with data fetches and hero image preloads firing before the timeline ends. This comes from search-result summaries only, because the full articles returned HTTP 403 — [Codrops, testimonial hero (2026)](https://tympanus.net/codrops/2026/08/18/building-an-animated-testimonial-hero-using-the-gsap-timeline-and-dynamic-cms-data/); [Codrops, GSAP portfolio (2026)](https://tympanus.net/codrops/2026/05/06/from-shader-uniforms-to-clip-path-wipes-how-gsap-drives-my-portfolio/)

### Inferences
- A workable budget that follows from NN/g and RAIL: each element's tween lasts roughly 0.4–0.9 s, the steps overlap through timeline offsets, and the headline and CTA are readable within about 1 s of first paint. A preloader held longer than about 1 s crosses the RAIL "lose focus" line, and one held past 10 s risks abandonment.
- Durations for strong ease-out curves (expo/quint out) can be longer than NN/g's 500 ms UI ceiling without feeling slow. These curves cover most of the distance in the first part of the tween, so the perceived duration is shorter than the nominal one. This is inferred from the curve shape (see Q2) and was not measured.
- Keep the nav and CTA interactive from the first frame even if they are still animating in, so nobody waits on the animation (Apple HIG). Play the full intro once per session and shorten or skip it on repeat visits.

### Gaps
- No primary source (Apple, Awwwards juries, GSAP) was found that gives a numeric reference timeline for a hero intro or a maximum total intro duration. The Codrops articles that might hold concrete values returned HTTP 403.
- Apple.com's actual web easing and timing values for product-page intros are not publicly documented.

## 2. Easing curves and stagger values

### Takeaway
The "premium" curves are strong ease-outs: easeOutQuint `cubic-bezier(0.22, 1, 0.36, 1)` and easeOutExpo `cubic-bezier(0.16, 1, 0.3, 1)`, the latter being GSAP's `expo.out`. Apple's native motion model is springs defined by perceptual duration and bounce, with bounce 0 as the general-purpose default and anything above 0.4 considered too bouncy for UI.

### Cited Findings
- CSS equivalents from easings.net: easeOutCubic `cubic-bezier(0.33, 1, 0.68, 1)`; easeOutQuart `cubic-bezier(0.25, 1, 0.5, 1)`; **easeOutQuint `cubic-bezier(0.22, 1, 0.36, 1)`**; **easeOutExpo `cubic-bezier(0.16, 1, 0.3, 1)`**; easeOutCirc `cubic-bezier(0, 0.55, 0.45, 1)`; easeInOutCubic `cubic-bezier(0.65, 0, 0.35, 1)`; easeInOutQuint `cubic-bezier(0.83, 0, 0.17, 1)`; easeInOutExpo `cubic-bezier(0.87, 0, 0.13, 1)`; easeOutBack `cubic-bezier(0.34, 1.56, 0.64, 1)`. Elastic and bounce curves have no CSS cubic-bezier equivalent — [easings.net source (easings.yml)](https://raw.githubusercontent.com/ai/easings.net/master/src/easings.yml)
- NN/g: use ease-out for entrances, because it "makes the animation feel responsive, but allows the eye time to focus on the element as it comes to rest", and ease-in for exits — [NN/g](https://www.nngroup.com/articles/animation-duration/)
- Apple (WWDC23, "Animate with springs"): springs take two parameters, **duration** (a *perceptual* duration "chosen to be predictable") and **bounce** (−1.0 to 1.0). The settling duration is separate and less predictable — [WWDC23 session 10158](https://developer.apple.com/videos/play/wwdc2023/10158/)
- Apple bounce guidance: bounce 0 is "a great general purpose spring that's the most versatile". About 15% "doesn't feel very bouncy yet, but the long tail feels a little more brisk". About 30% gives "noticeable bounciness". Values above 0.4 "may feel too exaggerated for a UI element" — [WWDC23 session 10158](https://developer.apple.com/videos/play/wwdc2023/10158/)
- Springs preserve velocity and can be interrupted: "a spring animation uses the velocity it had when it was retargeted as the initial velocity towards its new destination" — [WWDC23 session 10158](https://developer.apple.com/videos/play/wwdc2023/10158/)
- SwiftUI presets: `.smooth` has "no bounce", `.snappy` has a "small amount of bounce", and `.bouncy` has a "higher amount of bounce". Each is tunable through `(duration:extraBounce:)` — [Apple docs, Animation.smooth](https://developer.apple.com/documentation/swiftui/animation/smooth)
- Lenis (the smooth-scroll library common on Awwwards sites) defaults to lerp 0.1. Its default easing is exponential ease-out, `t => Math.min(1, 1.001 - Math.pow(2, -10 * t))`, with duration 1.2 s, and duration/easing apply only when lerp is not set — [Lenis GitHub](https://github.com/darkroomengineering/lenis)
- GSAP ScrollTrigger's snap uses `"power3"` as its default ease — [GSAP ScrollTrigger docs](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
- GSAP's official SplitText demo uses `yPercent: 20, opacity: 0, stagger: 1, duration: 3`. These are exaggerated demo values, not production recommendations — [GSAP SplitText docs](https://gsap.com/docs/v3/Plugins/SplitText/)

### Inferences
- GSAP `expo.out` ≈ CSS `cubic-bezier(0.16, 1, 0.3, 1)`, and `power4.out` (quint) ≈ `cubic-bezier(0.22, 1, 0.36, 1)`. GSAP's powerN naming maps power1 to quad, power2 to cubic, power3 to quart and power4 to quint. This mapping comes from general GSAP knowledge and was not re-fetched in this session.
- A web translation of Apple's default: a critically damped spring (bounce 0) about 0.5 s long for the object reveal, and small bounce (0.1–0.15) at most for playful accents.
- Working per-line and per-word stagger values seen in practice are about 0.05–0.15 s. **This is unverified**: no primary source retrieved in this session gives a number.

### Gaps
- No retrieved source states typical stagger values (seconds per line, word or char) for Awwwards-level sites. The Codrops pages were blocked (403).
- The SwiftUI numeric preset defaults (duration and bounce for `.smooth`, `.snappy` and `.bouncy`) were not stated in the documentation that was fetched.

## 3. Text reveal techniques (line masks, split text)

### Takeaway
The standard technique is GSAP SplitText with `mask: "lines"`. Each line is wrapped in a clipping container and the inner line animates up from below (yPercent). The split runs inside `onSplit` with `autoSplit: true` so it survives font loading and resizes, and ARIA handling stays on.

### Cited Findings
- `mask` accepts `"lines"`, `"words"` or `"chars"`, one at a time. It wraps each split element in an extra clipping container and exposes the wrappers through a `masks` array — [GSAP SplitText docs](https://gsap.com/docs/v3/Plugins/SplitText/)
- `autoSplit: true` re-splits when web fonts finish loading, or when the element's width changes while lines are being split. Animations **must** be created inside `onSplit()`. If `onSplit` returns the tween, GSAP carries its `totalTime()` over to the new split — [GSAP SplitText docs](https://gsap.com/docs/v3/Plugins/SplitText/)
- Fonts: wait for `document.fonts.ready` or use `autoSplit`, otherwise line breaks can be wrong — [GSAP SplitText docs](https://gsap.com/docs/v3/Plugins/SplitText/)
- Accessibility: the default `aria: "auto"` adds `aria-label` to the parent and `aria-hidden="true"` to the split children, so screen readers read the whole sentence — [GSAP SplitText docs](https://gsap.com/docs/v3/Plugins/SplitText/)
- `deepSlice` (default true) keeps nested elements that span lines from inflating line height. For performance, "split only what you need" — [GSAP SplitText docs](https://gsap.com/docs/v3/Plugins/SplitText/)

### Inferences
- For hero headlines, the common premium pattern is lines masked, the inner line moving from `yPercent: 100` to `0` with `expo.out` or `power4.out`, and a small stagger. Splitting by lines and words rather than chars keeps the DOM small, which matters for LCP and INP on the hero.

### Gaps
- There was no primary-source benchmark on the performance cost of char splits compared with line splits.

## 4. Scroll-linked motion on Apple-style pages (scrubbing, pinning, parallax, velocity) and the hand-off to the next section

### Takeaway
Apple's signature scroll effect pins a canvas and draws one frame of a pre-rendered image sequence per scroll position, so the scrollbar acts as a playhead. It does not scroll-jack, and slow connections get a single fallback image. On the web this is built with a pinned section plus a scrubbed timeline (GSAP ScrollTrigger), or natively with CSS scroll-driven animations, which run off the main thread.

### Cited Findings
- Apple's AirPods Pro effect is a canvas flip-book. The analysis counts **148 JPG frames at about 31 KB each**, named `0001.jpg` and up, and drawn with `context.drawImage`. The frame index is `Math.floor(scrollTop / maxScrollTop * frameCount)`, drawing happens inside `requestAnimationFrame`, and frames are preloaded — [CSS-Tricks](https://css-tricks.com/lets-make-one-of-those-fancy-scrolling-animations-used-on-apple-product-pages/)
- In the demo the canvas is `position: fixed` (sticky), limited to 100vh/100vw, over a 500vh scroll track. Apple serves "a single fallback image instead of the entire image sequence" on slow 3G. The article reports about 55.8 MB transferred and 1,609 requests on Apple's page, which shows the weight cost — [CSS-Tricks](https://css-tricks.com/lets-make-one-of-those-fancy-scrolling-animations-used-on-apple-product-pages/)
- A search-result summary cited "65 PNGs, 15.2 MB" for an AirPods sequence. This conflicts with the 148-frame figure above, is unverified, and the numbers probably depend on the page and year — [search summary citing geyer.dev](https://geyer.dev/blog/css-image-sequence-animations/)
- ScrollTrigger `scrub: true` ties progress directly to the scrollbar. `scrub: 1` adds smoothing, meaning a 1 s "catch-up" — [GSAP ScrollTrigger docs](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
- Pinning wraps the element in a `pin-spacer` and adds padding by default (`pinSpacing`) so the following content waits. `anticipatePin: 1` pins slightly early on fast scrolls to avoid a flash — [GSAP ScrollTrigger docs](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
- Snap settings: `duration` can be a velocity-clamped range such as `{min: 0.2, max: 3}`. The default delay is half the scrub amount or 0.1 s, the default ease is `"power3"`, and snapping is directional by default (v3.8+) — [GSAP ScrollTrigger docs](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
- Velocity: `getVelocity()` returns px/s. `fastScrollEnd` forces a tween to finish when the user leaves above 2500 px/s (the default threshold). `preventOverlaps` completes earlier triggers during fast scrolls — [GSAP ScrollTrigger docs](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
- ScrollTrigger does "no scroll-jacking" and works with native CSS scroll snapping — [GSAP ScrollTrigger docs](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
- CSS scroll-driven animations: `animation-timeline: scroll()` or `view()`, with `animation-range` values `entry`, `exit`, `cover`, `contain`, `entry-crossing` and `exit-crossing`. They run "off the main thread", avoiding main-thread jank. Supported in Chrome/Edge 115+, Safari 26+, and Firefox Technology Preview — [Chrome for Developers](https://developer.chrome.com/docs/css-ui/scroll-driven-animations)
- Smooth-scroll libraries such as Lenis interpolate scroll with lerp 0.1 by default — [Lenis GitHub](https://github.com/darkroomengineering/lenis)

### Inferences
- A clean hero-to-next-section hand-off: pin the hero for a short scrubbed range, scale or translate the hero object and fade the headline with `scrub` of about 0.5–1 s, then unpin with `pinSpacing` so the next section slides over or follows. Alternatively, use `view()` with `animation-range: exit` in CSS so the hero exits with no JS.
- Image sequences cost a lot of bandwidth (tens of MB). Where scroll-scrubbing is used, provide a single-frame fallback for slow networks and reduced motion, as Apple does.
- Velocity effects such as skew or blur driven by `getVelocity()` should be clamped and disabled under reduced motion (see Q5).

### Gaps
- It is not documented whether current (2025–2026) apple.com pages still use JPG canvas sequences or have moved to scroll-scrubbed video or WebGL. The CSS-Tricks analysis predates 2025.
- No primary source was found that quantifies what Apple avoids (for example, a statement that it does not hijack wheel events). Only GSAP's "no scroll-jacking" statement was sourced.

## 5. Depth on light/white backgrounds

### Takeaway
On white, depth comes from soft, layered, low-alpha shadows that share one light source and tint toward the background hue. Shadows spread and soften, and lose opacity, as elevation rises. `drop-shadow()` gives cut-out product images a shadow that follows their shape.

### Cited Findings
- Layered shadows look more realistic than a single one. Example: `0 1px 1px`, `0 2px 2px`, `0 4px 4px`, `0 8px 8px` and `0 16px 16px`, each `hsl(0deg 0% 0% / 0.075)` — [Josh W. Comeau, Designing Beautiful Shadows](https://www.joshwcomeau.com/css/designing-shadows/)
- Use one consistent light source, with every shadow keeping the same offset ratio (vertical = 2× horizontal) — [Josh W. Comeau](https://www.joshwcomeau.com/css/designing-shadows/)
- Tint shadows with the background hue (for example `hsl(220deg 60% 50%)`) instead of black, because black desaturates — [Josh W. Comeau](https://www.joshwcomeau.com/css/designing-shadows/)
- Higher elevation means more offset, more blur and **lower** opacity. `filter: drop-shadow(...)` follows the contour of transparent images — [Josh W. Comeau](https://www.joshwcomeau.com/css/designing-shadows/)

### Inferences
- For a product object on white: a tight, darker contact shadow directly under the object plus a wide, faint ambient shadow (two drop-shadows). During the intro, animate the shadow's scale and opacity in sync with the object's Y position so it reads as a real "landing".
- Depth-of-field blur (`filter: blur()` on background layers) is expensive to animate. Keep it static or apply it to small layers only, in line with the RAIL 10 ms frame budget ([web.dev RAIL](https://web.dev/articles/rail)).

### Gaps
- No primary source was retrieved on studio-lighting, contact-shadow or depth-of-field practice specific to Apple or Awwwards pages (for example three.js/drei ContactShadows parameters or Apple's product render lighting).

## 6. Accessibility and performance expectations (reduced motion, LCP, no scroll locking)

### Takeaway
Under reduced motion, keep essential feedback and drop decorative reveals, parallax and zoom. Never start the LCP element (the hero headline or image) at `opacity: 0`, because Chrome ignores opacity-0 paints for LCP. Never block interaction or scroll while the intro plays.

### Cited Findings
- `prefers-reduced-motion: reduce` reflects an OS setting. Parallax, scroll-linked animations of non-target elements, and zoom or scale can trigger vestibular symptoms ("dizziness, nausea, and migraine headaches"). The recommended approach is selective: "the non-necessary reveal animations are gone, and just the regular scrolling motion is left." Listen with `matchMedia('(prefers-reduced-motion: reduce)')` and its `change` event — [web.dev, prefers-reduced-motion](https://web.dev/articles/prefers-reduced-motion)
- Apple HIG: "Make motion optional… avoid using it as the only way to communicate important information." — [Apple HIG, Motion](https://developer.apple.com/design/human-interface-guidelines/motion)
- Chrome 86: "Largest Contentful Paint ignores paints with opacity 0". Chrome 144: "Corrected LCP and FCP handling when document opacity changes from zero to non-zero", which covers the "hide `<html>` or body until loaded" preloader pattern — [Chromium LCP changelog](https://chromium.googlesource.com/chromium/src.git/+/master/docs/speed/metrics_changelog/lcp.md)
- DebugBear (search summary; the fetch failed with DNS): fading an image in over 500 ms can push LCP back by about 500 ms. Fix it by starting the LCP element at `opacity: 1` and animating only transform, scale or filter, or by starting at a small non-zero opacity such as 0.01. Where LCP is recorded during a fade (first non-zero frame or end of animation) is unclear across sources — [DebugBear](https://www.debugbear.com/blog/opacity-animation-poor-lcp); [Chromium changelog](https://chromium.googlesource.com/chromium/src.git/+/master/docs/speed/metrics_changelog/lcp.md)
- Real case: removing a JS-driven image fade-in improved LCP by **6 s** (about 12 s down to 6 s). Loading the transition script asynchronously instead cut the added delay to about 0.5 s — [Shopify Performance](https://performance.shopify.com/en-ca/blogs/blog/improve-largest-contentful-paint-lcp-by-removing-image-transitions)
- Apple HIG: don't make people wait for an animation to finish before acting — [Apple HIG, Motion](https://developer.apple.com/design/human-interface-guidelines/motion)
- ScrollTrigger claims no scroll-jacking. Pair it with `gsap.matchMedia()` for responsive and conditional setups — [GSAP ScrollTrigger docs](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
- SplitText's default ARIA mode keeps split text readable by screen readers — [GSAP SplitText docs](https://gsap.com/docs/v3/Plugins/SplitText/)

### Inferences
- Hero checklist:
  - Render the headline and hero image visible in the server HTML (a transform-only reveal, or a clip mask whose content is painted at full opacity).
  - Do not set `overflow: hidden` on body during the intro.
  - Keep the preloader under about 1 s, or remove it.
  - Under `reduce`, swap slides, parallax and scrub for a short fade (at most about 200 ms) or no animation, and show a static frame in place of any image sequence.
  - Use `gsap.matchMedia()` with `(prefers-reduced-motion: no-preference)` to build the full timeline only when motion is allowed.

### Gaps
- WCAG success criteria (2.2.2 Pause, Stop, Hide; 2.3.3 Animation from Interactions) are relevant but were not fetched or verified in this session.
- The exact timing Chrome uses to record LCP for an element fading in from a non-zero opacity was not confirmed from a primary source, because DebugBear could not be reached.
