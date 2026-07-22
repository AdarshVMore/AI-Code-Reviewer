# CodeRefyn — Design System Contract

> This file is the single source of truth for visual and motion decisions. Any UI change
> should be checkable against this file. If a decision isn't here, don't invent it —
> add it here first, then implement it. Direction: **Raycast-warm developer tool**
> (near-black blue-tinted canvas, layered "glass" elevation instead of flat borders,
> one warm punctuation accent used sparingly) + **expressive, purposeful motion**.

## 1. Direction in one sentence

A precision instrument for reviewing code, not a spreadsheet: dark, dense, keyboard-first,
but alive — the AI reviewing your PR should *feel* like it's working (pulsing status,
animated graph, motion that responds to you), not like a static report generator.

## 2. Color tokens

Keep the existing brand indigo as the primary chrome accent (already close to Raycast/Linear
territory) and add ONE warm punctuation color reserved for "the AI is alive" moments —
never used for static chrome.

```css
@theme {
  /* Surface ladder — near-black, blue-tinted. Never pure #000. 4 steps of elevation. */
  --color-bg-canvas:  #0a0b0d;   /* page background (was #0c0c0c) */
  --color-bg-surface: #101113;   /* was #141414 */
  --color-bg-raised:  #16171a;   /* was #1a1a1a */
  --color-bg-overlay: #1c1d21;   /* modals, command palette, dropdowns */

  /* Hairline borders are translucent WHITE, not flat gray. This is what separates
     "glass elevation" from "gray box" slop. */
  --color-border-hairline: rgba(255,255,255,0.06);
  --color-border-hover:    rgba(255,255,255,0.10);

  --color-text-primary:   #ededed;
  --color-text-secondary: #8b8b93;   /* slight blue-cool shift from #888888 */
  --color-text-tertiary:  #55565c;
  --color-text-inverse:   #0a0b0d;

  /* Primary brand accent — chrome, nav, primary CTA, focus rings. Ration to <10% of a view. */
  --color-brand:        #5b6af0;
  --color-brand-muted:  #1e2140;
  --color-brand-hover:  #4a59e8;
  --color-brand-glow:   rgba(91,106,240,0.35);   /* for glow/shadow only, never fill */

  /* Punctuation accent — reserved EXCLUSIVELY for "AI is active" states:
     live review pulse, graph edge traversal animation, apply-fix in-flight.
     Never used as decoration or on static elements. */
  --color-pulse:      #ff7a45;
  --color-pulse-glow: rgba(255,122,69,0.4);

  /* Severity — unchanged, already good bones */
  --color-severity-high: #ef4444;      --color-severity-high-bg: #1f0a0a;   --color-severity-high-text: #fca5a5;
  --color-severity-med:  #f59e0b;      --color-severity-med-bg:  #1f1200;   --color-severity-med-text:  #fcd34d;
  --color-severity-low:  #22c55e;      --color-severity-low-bg:  #0a1f0e;   --color-severity-low-text:  #86efac;

  --color-status-active: #22c55e;  --color-status-active-bg: #0a1f0e;
  --color-status-paused: #8b8b93;  --color-status-paused-bg: #16171a;
  --color-status-failed: #ef4444;  --color-status-failed-bg: #1f0a0a;
}
```

## 3. Typography

Keep Geist Sans / Geist Mono (already loaded, already a good developer-tool signal —
don't switch fonts just for novelty). Apply Raycast's typographic discipline on top:

- Body text: `+0.1px` to `+0.2px` letter-spacing (airy, readable on dark — counterbalances density)
- Display/headings (20px+): `-1px` to `-2px` tracking (tightened, confident)
- Geist Mono for: PR/issue identifiers, file paths, diff content, commit SHAs, counts — anything data-like
- Max 2 weights on screen at once: 400 (body) and 600 (emphasis). Never 700+/black weights — that's a slop tell.

## 4. Elevation, glass & ambient glow (the #1 anti-slop rule)

**Never** separate content with a flat 1px gray border as the first move. Order of operations:

1. Whitespace / padding first
2. Background lightness shift (surface → raised → overlay ladder above)
3. `--color-border-hairline` (translucent white, 6% opacity) — only if #1/#2 aren't enough
4. Layered shadow / glass for anything that should feel "lifted" (cards, modals, dropdowns, command palette)

```css
--shadow-raised: 0 1px 2px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.04);
--shadow-overlay: 0 8px 24px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06);
--shadow-glow-brand: 0 0 0 1px var(--color-brand-glow), 0 0 24px var(--color-brand-glow);
--shadow-glow-pulse: 0 0 0 1px var(--color-pulse-glow), 0 0 20px var(--color-pulse-glow);
```

Colored border-left strips are reserved for true semantic state (severity), never decoration.

### 4a. Glassmorphic cards — the signature card treatment

This is the primary "rich, alive" feeling that distinguishes CodeRefyn from a flat dashboard
template. Every default `Card` gets three layered ingredients instead of a flat fill + border:

1. **Ambient color glow behind the card, not on it.** Each page has 1–3 large (400–600px),
   heavily blurred (`blur(80–120px)`), low-opacity (8–14%) radial gradient blobs positioned
   *behind* the card grid (a fixed/absolute layer under the content), using `--color-brand-glow`
   as the primary hue and `--color-pulse-glow` sparingly for one accent blob near "live" content.
   These blobs drift very slowly (60–90s ambient loop, §6) — barely perceptible motion, but the
   page never feels static.
2. **Translucent glass surface on the card itself:**
   `background: rgba(22, 23, 26, 0.55)` (a translucent `--color-bg-raised`) +
   `backdrop-filter: blur(20px) saturate(140%)` + `--color-border-hairline` — so the ambient
   glow bleeds through the card instead of being blocked by a flat opaque fill. This is the
   Raycast "frosted glass on a dark desk" effect, not a generic `backdrop-blur-sm` utility class.
3. **Inset highlight + soft shadow** from `--shadow-raised` to sell physical depth (a card reads
   as a pane of glass sitting slightly above the glow, not a sticker pasted on top of it).

```css
--glass-card-bg: rgba(22, 23, 26, 0.55);
--glass-card-blur: blur(20px) saturate(140%);
--glow-blob-brand: radial-gradient(circle, var(--color-brand-glow) 0%, transparent 70%);
--glow-blob-pulse: radial-gradient(circle, var(--color-pulse-glow) 0%, transparent 70%);
```

Rules to keep this from tipping into slop:
- Glow blobs live in ONE shared background layer per page (not per-card) — cards borrow the
  glow behind them, they don't each generate their own halo.
- Never more than 2–3 blobs visible in a viewport at once.
- On hover, a card's border brightens to `--color-border-hover` and it lifts ~2px — the glass
  itself doesn't change opacity (that reads glitchy).
- Modals/command palette/overlay surfaces use a stronger blur (`blur(24px) saturate(160%)`,
  `--shadow-overlay`) so they read as a distinct, higher z-plane than page cards.

## 5. Radius & spacing

- Radius scale: `4px` (badges/chips) · `8px` (buttons, inputs) · `12px` (cards) · `16px` (panels/modals) · `9999px` (pills, avatars)
- Spacing: 4px base grid → `4, 8, 12, 16, 24, 32, 48, 64, 96` — no arbitrary values outside this scale

## 6. Motion (expressive, but calibrated — not default-AI motion)

Library: `motion` (the current Framer Motion package). Rules, not vibes:

| Interaction | Duration | Easing | Amplitude |
|---|---|---|---|
| Hover / tap feedback | 150–180ms | `ease-out` | scale 1.03–1.06 (never 1.2 — reads childish) |
| Entrance (card, row) | 280–380ms | custom overshoot cubic-bezier `[0.16, 1, 0.3, 1]` | 12–16px rise, not 20px+ |
| List stagger | 40–60ms delay/child | same as entrance | — |
| Layout morph (`layoutId`) | 350ms | spring (`stiffness: 260, damping: 24`) | — |
| Exit | 150–200ms (faster than entrance) | `ease-in` | — |
| Ambient/live (pulse, glow) | 1.6–2.2s loop | `ease-in-out` | opacity 0.4↔1, scale 1↔1.04 |
| Scroll reveal | `useInView`, once | same as entrance | 16px |

Respect `prefers-reduced-motion` globally — swap all of the above to opacity-only 100ms.

"Expressive" means: the command palette has a spring-open feel, the graph has ambient node
drift + edge-traversal animation while the AI is querying it, and the live-review indicator
genuinely pulses — but hovers/taps stay restrained and fast. Expressive ≠ slow.

## 7. Signature features (what makes this uniquely CodeRefyn, not "a dashboard template")

### 7a. Code graph visualization
Surface the code graph you already built (Neo4j) visually — not just use it internally for RAG.
- Where: repo detail page, and a contextual mini-graph on the PR review page showing the
  files/symbols touched and their neighbors (ties directly to `findGraphNeighbors`).
- Library: `reagraph` (WebGL force-directed graph, built for exactly this, good default motion).
- Motion: ambient node drift, edges animate/"pulse" in `--color-pulse` while a query is in-flight,
  clicking a node highlights its neighborhood with `--color-brand-glow`.

### 7b. Cmd+K command palette
- Library: `cmdk` (small, unstyled, the de facto standard — Linear/Vercel/Raycast all use
  bespoke UI on top of this exact primitive).
- Actions: jump to repo, jump to PR, jump to issue, trigger re-review, toggle theme (future),
  search across everything.
- Motion: spring scale-in from 0.96→1 + backdrop blur fade, per §6.

### 7c. Live "AI reviewing" state
- Tie directly to real pipeline status (`PRReview` status field / worker events) — not fake.
- Visual: pulsing dot + animated progress copy ("Reading diff…" → "Cross-referencing code
  graph…" → "Writing review…") using `--color-pulse`, shown on the PR page while a review
  is in-flight, and as a live badge on the dashboard's recent-reviews list.

## 8. Anti-slop checklist (run this against every screen before calling it done)

- [ ] No flat 1px gray border used as the *first* separation technique
- [ ] No more than 2 font weights visible on screen
- [ ] `--color-pulse` only appears on active/live elements, never static decoration
- [ ] Every animation has a stated purpose (feedback, hierarchy, or liveness) — not decoration
- [ ] Motion timing pulled from the table in §6, not left at library defaults
- [ ] Empty/loading/error states are designed, not `<p>No data.</p>`
- [ ] Data-like values (IDs, paths, SHAs, counts) use Geist Mono
