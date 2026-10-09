# MeMeMe Responsive / Multi-Screen UI — checkpoint (2026-10-10)

## User objective

A game UI that remains functional at different browser zoom levels, desktop monitors, ultrawide, mobile portrait/landscape and Steam Deck. No decorative black letterboxing, no clipped buttons, no microtext caused by scale-to-fit. Preserve board interaction coordinates and readable touch targets.

## What was actually delivered to this *compiled mirror*

- `assets/responsive-ui-v1.css` is loaded after the original compiled stylesheet.
- Fluid sizing and bounded scroll for DOM-driven menu, lobby, setup, character selection, rules, quick mini game, result, online room and editor screens.
- Adaptive card grids for smaller screens and short landscape viewports.
- Safe-area-aware popup sizing and BGM HUD placement.
- Background extends to the viewport edges; legacy shadow border on the gameplay canvas removed.
- CI smoke guards that the responsive stylesheet is linked and that no stretch-based canvas hack is introduced.

## Important limitation

**This is an incremental DOM UI pass, not the finished multi-aspect gameplay system.**

The deployed playtest repo is a *compiled export only* (index.html, CSS, bundled JS). Board rendering, camera framing, hit testing, drag/tap mapping, and modal layout authority live inside the missing source. Existing game viewport/orientation handling is preserved. The web mirror cannot safely restructure those calculations by overriding canvas width/height. Public `RVTGMzz/Mmm-BG` is game design/docs rather than the executable gameplay frontend source; `RVTGMzz/Mmm-WP` is another compiled mirror.

## Source-side integration required for true all-aspect gameplay

1. Add `ViewportMetrics` using `window.visualViewport` where available, `ResizeObserver`, `100dvh`, and safe-area insets. Debounce resize without delaying input hit testing.
2. Keep a stable **world coordinate system** for the board and tokens. Map viewport coordinates to world using the inverse camera transform; reuse this mapping for mouse, touch, gamepad focus and hover.
3. Define fit/fill rules per screen: full-bleed adaptive scenes and backgrounds; board world fits inside a safe interactive rectangle without cropping actionable tiles. Do not stretch sprites.
4. Move HUD and overlays into safe anchored zones that do **not** cover the board or each other. Support 21:9, 16:9, 16:10, 4:3 and portrait using layouts rather than global `scale()` hacks.
5. On narrow portrait, either use a dedicated board layout with pan/zoom and fixed overlay controls, or rotate the **board camera only** while keeping text/buttons upright; never block actual gameplay with a permanent rotate-device screen.
6. Check all UI transitions (Splash → Lobby → Setup → Character → Rules → Roll For Order → Board → Job/Card/News/Mini Game → Podium → Recap), including CPU automations, after resizing.
7. Rebuild and publish the compiled output, preserving the standalone responsive CSS layer or merging equivalent source-owned responsive styles; do not let the next compile silently revert this work.

## Manual viewport acceptance matrix

| Viewport | Scenario | Acceptance |
|---|---|---|
| 1920×1080 (16:9) | Entire flow | UI fills available scene; board tokens not distorted |
| 2560×1080 (21:9) | Board + HUD | No black framing; extraspace used deliberately |
| 1280×800 (16:10) | Steam Deck + mouse/controller | No clipping; dice/cards accessible |
| 1024×768 (4:3) | Full round | HUD readable and board selectable |
| 960×540 (small landscape) | Menus and one turn | Popup scroll where needed, no overlap over buttons |
| 844×390 (phone landscape) | Mini Game + settings | Controls remain tappable; safe insets respected |
| 390×844 (phone portrait) | Lobby, setup, then board | One-column menus, gameplay remains usable |
| 360×640 (narrow portrait) | Rules / face editor | No offscreen confirm/back controls |
| Desktop browser zoom 80%, 125%, 150%, 200% | Resize while playing | Pointer hit tests track visuals; no stale transforms |

**Acceptance criteria:** zero missing primary actions, minimum ~44 CSS px touch target when feasible, no text clipped behind modal, board clicks correspond to intended tiles after resizing, no FPS/perf regression from repeated resize, no CPU input deadlock.

## Evidence / status

- GitHub smoke verifies file/link and structural markers only: **not a visual regression test**.
- Desktop/mobile live browser layout acceptance: **PENDING**.
- Source-owned adaptive board camera/hit tests: **NOT YET IMPLEMENTED**.
- Do not mark this feature 'complete on all devices' until the source-side criteria above pass.
