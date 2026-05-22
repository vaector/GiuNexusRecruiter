# NEXUS Design Principles

Every page must inherit the visual DNA established on the home page. The following principles are law — deviation requires an explicit design decision documented in code comments.

---

## 1. Dark Canvas

The base surface is **near-black**.

| Token | Value | Use |
|---|---|---|
| `bg-base` | `#030303` | Page background. Set on `<body>` or root container. |
| `bg-surface` | `rgba(8, 12, 24, 0.4)` | Unscrolled glass panels (nav, cards). |
| `bg-surface-solid` | `rgba(6, 12, 24, 0.92)` | Scrolled / elevated panels (dropdowns, modals). |
| `bg-surface-raised` | `rgba(8, 12, 24, 0.88)` | Scrolled nav, sticky headers. |

Never use pure white (`#fff`) as a background. Never use pure black (`#000`) for text on dark surfaces — use `#eaf2ff`.

---

## 2. Layer Stack

Every section renders layers bottom-to-top:

1. **Base** — `bg-base` (`#030303`) solid fill.
2. **Fluid / Ambient** — WebGL fluid simulation or CSS radial glows (optional for content pages).
3. **Content** — Actual UI elements at the highest z-index.
4. **Grain Overlay** — SVG `feTurbulence` fractal noise at opacity `0.03`–`0.07`, `pointer-events: none`.
5. **Vignette Overlay** — `radial-gradient(circle, transparent 30%, rgba(0,0,0,0.6) 120%)`, `pointer-events: none`.
6. **Scanlines** (optional) — `linear-gradient(to bottom, rgba(255,255,255,0) 50%, rgba(0,0,0,0.03) 50%)` at `backgroundSize: 100% 4px`, `pointer-events: none`.

Grain SVG (use verbatim):
```
url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")
```

Both grain and vignette overlays are **required** on every full-page section and on glass panels / cards.

---

## 3. Color System

### Accent

| Token | Value | Use |
|---|---|---|
| `accent` | `#00e5cc` | **The single accent color.** Active states, unread indicators, CTAs, links, progress bars, glowing borders. |
| `accent-dim` | `rgba(0, 229, 204, 0.12)` | Borders on glass panels, hover backgrounds. |
| `accent-mid` | `rgba(0, 229, 204, 0.4)` | Left-border highlights, hover states. |
| `accent-glow` | `rgba(0, 229, 204, 0.25)` | `box-shadow` glow on active elements. |

**Do not** introduce a second chromatic accent. The teal IS the brand.

### Text Hierarchy

| Token | Value | Use |
|---|---|---|
| `text-primary` | `#eaf2ff` | Headings, primary labels. |
| `text-secondary` | `rgba(234, 242, 255, 0.45)` | Body text, nav links (inactive). |
| `text-tertiary` | `rgba(234, 242, 255, 0.3)` | Metadata, timestamps, fine print. |
| `text-muted` | `rgba(234, 242, 255, 0.6)` | Secondary interactive labels. |
| `text-accent` | `#00e5cc` | Accent text, links, badges, active indicators. |

### Glass Borders

| Token | Value | Use |
|---|---|---|
| `border-glass` | `rgba(255, 255, 255, 0.06)` | Dividers within panels. |
| `border-glass-hover` | `rgba(0, 229, 204, 0.5)` | Left inset on hover states. |
| `border-glow` | `rgba(0, 229, 204, 0.12)` | Panel outer borders. |

---

## 4. Typography

### Font Stack

| Role | Font | Fallback |
|---|---|---|
| **HUD / Monospace** | `'JetBrains Mono'` | `'Fira Code', monospace` |
| **Display** | `'Syncopate'` | `Inter, system-ui, sans-serif` |
| **Body** | `'Inter'` | `system-ui, -apple-system, sans-serif` |

### Size Scale

| Token | Size | Weight | Tracking | Case | Use |
|---|---|---|---|---|---|
| `display-hero` | 3.5–5rem | 500–700 | -1px to 0 | Uppercase | Page titles, hero text. |
| `display-lg` | 2.5–3rem | 600 | -0.5px | Uppercase | Section headings. |
| `display-md` | 1.5–2rem | 600 | 0 | — | Card titles, sub-sections. |
| `body-lg` | 1rem (16px) | 400 | 0 | — | Primary body text. |
| `body-sm` | 0.72rem | 400 | 0.06em | — | Secondary text, metadata. |
| `caption` | 0.6rem | 400 | 0.03em | — | Timestamps, fine print. |
| `eyebrow` | 0.72rem | 400 | 0.14em | Uppercase | Nav links, labels, HUD tags. |
| `mono-sm` | 0.68rem | 500 | 0.06em | — | Mono labels, timestamps, HUD readouts. |

### Rules

- **HUD text** must use `JetBrains Mono` (or `Fira Code`). No exceptions.
- **Section headings** are uppercase with wide tracking (`0.08em`–`0.14em`).
- **Never use sentence-case for HUD labels.** Always uppercase with tracking.

---

## 5. Effects & Motion

### Smooth Scrolling

Use Lenis with `lerp: 0.07` on pages with scroll-driven animation. For content pages, Lenis is optional but recommended for consistency.

### Spotlight / Pointer Follow

Glass panels (nav, cards) must include a radial gradient that follows the pointer:
```css
background: radial-gradient(
  280px circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%),
  rgba(255, 255, 255, 0.07),
  transparent 70%
);
```
Track `pointermove` and update `--spotlight-x` / `--spotlight-y` CSS custom properties.

### Gooey Cursor

On pages where full immersion is desired, include `<GooeyCursor />`. Hidden on mobile / touch (`@media (max-width: 768px)` and `@media (pointer: coarse)`).

### Corner Frame

Use `<CornerFrame visible />` for focus frames with mouse-following parallax and color cycling.
- Border: `2px solid rgba(100,200,220,0.6)` with mask-clipped corners (80px × 80px).
- Lerp mouse position at `0.03` rate for smooth parallax.
- Color cycles between teal and warm tones over time.

### Hover States

- Interactive elements scale on hover: `transform: scale(1.02)`–`scale(1.1)`.
- Glow on hover: `box-shadow: 0 0 8px rgba(0,229,204,0.25)` or `text-shadow`.
- Transitions use `cubic-bezier(0.16, 1, 0.3, 1)` for snappy entrance / `0.45s cubic-bezier(0.4, 0, 0.2, 1)` for state changes.
- Left inset accent on card hover: `box-shadow: inset 2px 0 0 rgba(0, 229, 204, 0.5)`.

### Custom Scrollbar

Pages with scrollable content must render a right-side teal progress scrollbar:
- Track: `rgba(255,255,255,0.04)`, 3px wide.
- Thumb: `rgba(0,229,204,0.5)`, 36px tall, with `box-shadow: 0 0 8px rgba(0,229,204,0.25)`.
- Position: `fixed`, right 6px, top 12%, bottom 12%.

---

## 6. Glass Panel / Card Pattern

All panels, dropdowns, and cards follow this chrome:

```css
background: rgba(6, 12, 24, 0.92);
backdrop-filter: blur(20px);
-webkit-backdrop-filter: blur(20px);
border: 1px solid rgba(0, 229, 204, 0.12);
border-radius: 4px;
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 1px rgba(0, 229, 204, 0.2);
```

### Card Variants

| Variant | Border Left | Hover | Use |
|---|---|---|---|
| **unread** | `2px solid rgba(0,229,204,0.4)` | `background: rgba(0,229,204,0.04)` | Unread notification items. |
| **read** | none | `background: rgba(0,229,204,0.02)` | Read notification items. |
| **active** | `2px solid #00e5cc` | `box-shadow: 0 0 12px rgba(0,229,204,0.15)` | Selected state. |

### Panel Entry Animation

Panels must animate in with:
```css
transform: translateY(6px) scale(0.97);
opacity: 0;
/* → visible */
transform: translateY(0) scale(1);
opacity: 1;
transition: opacity 0.18s cubic-bezier(0.16, 1, 0.3, 1),
            transform 0.18s cubic-bezier(0.16, 1, 0.3, 1);
```

---

## 7. HUD Telemetry Overlays

Pages render fixed telemetry readouts in `JetBrains Mono`, right-aligned:

- **Progress**: `PROGRESS: 0.0%` — top-right, `fontSize: 9px`, `tracking: 0.14em`, `color: rgba(140,230,240,0.38)`, accent value in `#00e5cc`.
- **System status**: `SYS.READY`, `COORD: x, y` — top-left or contextual, same style.

These overlays are `pointer-events: none`, `z-index: 60`.

---

## 8. Badge & Count Pattern

Unread counts render as:
```css
background: #00e5cc;
color: #050a14;
font-size: 0.55rem;
font-weight: 700;
border-radius: 2px;
padding: 0.1rem 0.25rem;
min-width: 14px;
box-shadow: 0 0 6px rgba(0,229,204,0.4);
animation: bellPulse 2s ease-in-out infinite;
```

`bellPulse` keyframes pulse `box-shadow` between `0 0 3px rgba(0,229,204,0.3)` and `0 0 8px rgba(0,229,204,0.6)`.

---

## 9. Filter / Tab Bar Pattern

Category filters render as uppercase pill buttons:
```css
font-family: 'JetBrains Mono', 'Fira Code', monospace;
font-size: 0.68rem;
letter-spacing: 0.1em;
text-transform: uppercase;
padding: 0.4rem 0.75rem;
border-radius: 2px;
border: 1px solid rgba(255,255,255,0.08);
background: transparent;
color: rgba(234,242,255,0.45);
transition: all 0.18s ease;
```

Active state:
```css
background: rgba(0,229,204,0.1);
border-color: rgba(0,229,204,0.3);
color: #00e5cc;
box-shadow: 0 0 6px rgba(0,229,204,0.1);
```

---

## 10. Responsive Breakpoints

| Name | Width | Key Changes |
|---|---|---|
| Mobile | < 768px | Single column, stacked cards, hamburger nav, hide HUD overlays, hide gooey cursor. |
| Tablet | 768–1023px | Two-column grids where applicable. |
| Desktop | ≥ 1024px | Full layout. |

---

## 11. Accessibility

- All interactive elements have `tabIndex`, `aria-label`, `role` attributes.
- Focus rings use `box-shadow: 0 0 0 2px rgba(0,229,204,0.5)`.
- Unread indicators are not color-only — combine left border + background tint.
- Reduced-motion: wrap lerp animations in `prefers-reduced-motion` check.

---

## 12. Mandatory Checklist (Every Page)

- [ ] Body / root `background: #030303`
- [ ] Grain texture overlay (SVG `feTurbulence` at `opacity: 0.03`–`0.07`)
- [ ] Radial vignette overlay
- [ ] HUD monospace font for labels, counts, readouts
- [ ] Single accent color `#00e5cc` (no secondary chromatic accents)
- [ ] Glass panel chrome (`backdrop-filter: blur(20px)`, teal border)
- [ ] Teal scrollbar on scrollable containers
- [ ] Smooth transitions (`cubic-bezier(0.16, 1, 0.3, 1)` for enters)
- [ ] Responsive: hide HUD overlays and cursor effects on mobile
- [ ] Focus-visible rings on all interactive elements