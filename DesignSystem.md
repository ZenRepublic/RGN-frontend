# RGN Design System

## Philosophy & Approach

RGN is a consumer entertainment web app for the crypto-native, brainrot-friendly crowd. The feel should be **playful, colorful, energetic, and degen-welcoming** — think mobile game UI meets crypto dashboard.

- **Mobile-first.** The layout is a single centered column (max 600px) that looks identical on mobile and desktop. Desktop is just a taller phone — no multi-column layouts, no sidebar.
- **Animated background, not containers.** The primary design motif is bold animated diagonal blue stripes filling the entire viewport. UI elements sit directly on or above this background. Containers use dark semi-transparent backgrounds to create contrast — the background always bleeds through slightly.
- **Inverted text logic.** Text directly on the background uses a black stroke/shadow to stay readable over the blue stripes. Text inside dark containers is plain white — no stroke needed.
- **Tailwind CSS.** We are migrating to Tailwind. All new components should be written with Tailwind utility classes. Use CSS custom properties (`var(--yellow)` etc.) inside Tailwind's `[]` escape syntax where the design token isn't covered by the config. Existing plain CSS files will be migrated incrementally.

---

## Color Palette

Defined as CSS custom properties in `src/index.css`:

| Token              | Value     | Usage                                      |
|--------------------|-----------|--------------------------------------------|
| `--blue-main`      | `#5041E7` | Primary brand color, background stripes, active states, borders, sticky header background |
| `--blue-secondary` | `#6E63E7` | Secondary stripe color, section headings inside dark cards, header border |
| `--yellow`         | `#FEEE31` | Primary CTA buttons, highlighted values, accent text, divider lines |
| `--red`            | `#FF2F1F` | Back/destructive buttons, error states, hover-to-disconnect |
| `--black`          | `#050511` | True background, button text on yellow, text strokes |
| `--white`          | `#FFFFFF` | Default text color, button text on dark/red |
| `--gray`           | `#A0A0A0` | Muted/secondary text, placeholder text, disabled tab labels |

**Hard-coded surfaces (not tokens yet — migrate these):**

| Value     | Usage                                   |
|-----------|-----------------------------------------|
| `#1A1A1A` | Card/section backgrounds, input backgrounds, tab button backgrounds |
| `#333`    | Default border color for cards, inputs, tabs |

> **Tailwind config target:** Extend the theme with all tokens above plus `surface: '#1A1A1A'` and `border-subtle: '#333'`.

### Accent effects

- **Yellow glow:** `text-shadow: 0 0 8px rgba(254, 238, 49, 0.4)` — used on stat values and highlighted numbers
- **Blue border glow:** `border: 1px solid rgba(80, 65, 231, 0.4)` + `box-shadow: 0 0 20px rgba(80, 65, 231, 0.15)` — used on premium cards

---

## Fonts

Two custom fonts loaded globally in `src/index.css`.

### Masicu (Medium 500)

The **body font**. Used for all running text, labels, paragraphs, and softer UI elements.

- Body text, paragraphs, descriptions
- Form labels
- Header/nav buttons (Connect Wallet, Account button) — keeps them feeling approachable
- Loaded from: `/Fonts/Masicu-Medium.ttf`

### Xirod

The **display/UI chrome font**. Technical, uppercase-ready, gaming aesthetic. Used wherever the interface needs to feel like a HUD.

- All CTA and action buttons (`button.primary`, `button.back`, tournament register)
- Tab buttons (channel tabs, inner sub-tabs)
- Divider labels
- Any uppercase label or stat name that needs a technical feel
- Loaded from: `/Fonts/Xirod - new rubian font.otf`

> **Rule of thumb:** If it's something you'd read, use Masicu. If it's something you'd click or it's a UI label, use Xirod.

---

## Animated Background

The global background is defined on `body::before` in `src/index.css`:

```css
background: repeating-linear-gradient(
  45deg,
  var(--blue-main) 0px,
  var(--blue-main) 50px,
  var(--blue-secondary) 50px,
  var(--blue-secondary) 100px
);
animation: diagonalScroll 50s linear infinite;
/* moves at translateX(-50%) translateY(-50%) over 50s */
```

- The pseudo-element is `position: fixed; width: 200%; height: 200%` so it tiles seamlessly while scrolling
- `z-index: -1` — sits behind everything
- **Never put a solid background on `body` or `#root`** — it would cover the stripes

---

## Layout & Spacing

### Max-width container

```
#root: max-width 600px, margin: 0 auto
```

The entire app lives in this column. There are no breakpoints that change to multi-column layouts.

### Body padding

| Breakpoint  | Padding |
|-------------|---------|
| Mobile      | `16px`  |
| Tablet+ (≥768px) | `32px` |

### Padding scale

Use these values for all margin/padding/gap. In Tailwind these map to the default scale (`p-2` = 8px, etc.).

| px   | rem    | Use                                                  |
|------|--------|------------------------------------------------------|
| 4px  | 0.25rem | Micro gaps (icon spacing inside a row)              |
| 8px  | 0.5rem  | Small gaps, `h1` margin-bottom, tag spacing         |
| 12px | 0.75rem | Input vertical padding, tab vertical padding        |
| 16px | 1rem    | Standard gap, body base padding, field margin       |
| 20px | 1.25rem | Card padding (mobile), tab horizontal padding       |
| 24px | 1.5rem  | Card padding (desktop), CTA button padding, section gaps |
| 32px | 2rem    | Section bottom margin, desktop body padding         |
| 48px | 3rem    | Section margin desktop                              |

### Border-radius scale

| px   | Use                                                       |
|------|-----------------------------------------------------------|
| 4px  | Small utility elements: stat rows, badges, back buttons  |
| 8px  | Standard interactive elements: buttons, inputs, cards    |
| 12px | Large containers: main cards, sticky header, banners     |

---

## Typography

### Text directly on background (the animated blue stripes)

All text sitting on the background needs a black outline stroke to stay readable:

```css
text-shadow:
  -1px -1px 0 var(--black),
   1px -1px 0 var(--black),
  -1px  1px 0 var(--black),
   1px  1px 0 var(--black),
   0 0 8px rgba(0, 0, 0, 0.8);
```

> In Tailwind, use a custom utility or a CSS class `text-on-bg` for this shadow. Apply it to `h1`, `h2`, and `p` elements that are not inside a dark container.

### Text inside dark containers

Plain — no text-shadow needed. The dark background provides sufficient contrast.

### Type scale

| Element | Mobile    | Desktop (≥768px) | Font    | Weight |
|---------|-----------|------------------|---------|--------|
| `h1`    | 24px      | 40px             | Masicu  | 700    |
| `h2`    | 20px      | 22px             | Masicu  | 600    |
| `h2` in card | 20px | 22px            | Masicu  | 600, color `--blue-secondary` |
| `p`     | 14px      | 16px             | Masicu  | 400, line-height 1.5 |
| `label` | 14px      | 14px             | Masicu  | 500    |
| Stat label | 13-14px | 13-14px         | Masicu  | 500, uppercase, `letter-spacing: 0.5px`, color `--gray` |
| Stat value | 16px   | 16px             | Masicu  | 700, color `--yellow`, yellow glow shadow |
| `.highlight` | any  | any             | inherit | color `--yellow` |
| Small/secondary | 12-13px | 12-13px   | Masicu  | 400, color `--gray`, uppercase |
| Divider label | 13px | 13px            | Xirod   | uppercase, `letter-spacing: 2px`, color `--yellow` |

---

## Containers & Cards

### Standard dark card

The default container for sections of content.

```
background: #1A1A1A
border: 1px solid #333
border-radius: 12px
padding: 20px (mobile) / 24px (desktop)
```

> Tailwind: `bg-[#1A1A1A] border border-[#333] rounded-xl p-5 md:p-6`

### Glowing blue card (premium / featured)

Used for registration forms, important calls-to-action, and featured content panels.

```
background: rgba(5, 5, 17, 0.85)
border: 1px solid rgba(80, 65, 231, 0.4)
border-radius: 8px
box-shadow: 0 0 20px rgba(80, 65, 231, 0.15), inset 0 0 40px rgba(5, 5, 17, 0.6)
padding: 1.5rem
```

> Tailwind: `bg-[rgba(5,5,17,0.85)] border border-[rgba(80,65,231,0.4)] rounded-lg p-6 shadow-[0_0_20px_rgba(80,65,231,0.15),inset_0_0_40px_rgba(5,5,17,0.6)]`

### Stat row (key-value pair inside a card)

```
background: rgba(255, 255, 255, 0.04)
border-left: 3px solid var(--blue-main)
border-radius: 4px
padding: 0.75rem 1rem
display: flex; justify-content: space-between; align-items: center
```

Label: Masicu, ~13px, uppercase, `letter-spacing: 0.5px`, color `--gray`
Value: Masicu, 16px, bold, color `--yellow`, yellow glow text-shadow

---

## Buttons

All buttons use `font-family: Xirod` unless specified. Buttons are `width: 100%` by default except header/menu buttons and back buttons.

Global disabled state: `opacity: 0.5; cursor: not-allowed`
Global transition: `all 0.2s`
Global active scale: `transform: scale(0.98)`

### Primary / CTA

The main action button. Full-width. Yellow.

```
background: var(--yellow)
color: var(--black)
font-family: Xirod
font-size: 16px
font-weight: 600
padding: 16px 24px
border-radius: 8px
border: none
width: 100%
```

Hover: `background: #e6d62c`
> Tailwind: `w-full bg-[--yellow] text-[--black] font-[Xirod] text-base font-semibold py-4 px-6 rounded-lg`

### Back / Destructive

Compact, red. Used to go back or cancel. Width is `fit-content` unless `.full-width` modifier is applied.

```
background: var(--red)
color: var(--white)
font-family: Xirod
padding: 0.75rem 1.25rem
border-radius: 4px
width: fit-content
```

Hover: `opacity: 0.85`

### Tab button (top-level channel tabs)

Channel switcher row in `App.tsx`. Dark inactive, blue active.

```
/* Inactive */
background: #1A1A1A
border: 2px solid #333
color: var(--gray)
font-family: Xirod
font-size: 14px
padding: 12px 20px
border-radius: 8px
width: auto

/* Active */
background: var(--blue-main)
border-color: var(--white)
color: var(--white)

/* Hover (inactive only) */
border-color: var(--blue-main)
color: var(--white)
```

### Sub-tab button (inner content tabs)

Used inside a channel (e.g. Schedule / Tournaments in DioDudes). Same visual pattern as top-level tabs but scoped to a content section. Use identical styles.

### Menu / Header button

Compact buttons in the sticky header. Use `Masicu` font (softer feel, not Xirod). Never full-width.

**Connect Wallet button:**
```
background: var(--yellow)
color: var(--black)
font-family: Masicu
font-size: 15px
padding: 10px 20px
min-width: 140px
border-radius: 8px
width: auto
```
Hover: `background: #e6d62c; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(254,238,49,0.35)`

**Account button (wallet connected):**
Same size/shape as Connect Wallet but:
```
background: var(--white)
color: var(--black)
```
Hover: `background: #f3f3f3; transform: translateY(-1px)`

---

## Inputs & Form Fields

```
background: #1A1A1A
border: 2px solid #333
border-radius: 8px
padding: 12px 16px
color: var(--white)
font-family: Masicu (inherited)
font-size: 16px
width: 100%
```

Focus: `border-color: var(--blue-main); outline: none`
Placeholder: `color: var(--gray)`
Textarea min-height: `80px; resize: vertical`

Label above field: Masicu 14px, weight 500, `margin-bottom: 6px`, white.

Field wrapper: `margin-bottom: 16px` (last-child: 0).

---

## Sticky Header

Fixed to the top of the viewport, slides away on scroll-down and returns on scroll-up.

```
position: fixed; top: 8px
width: calc(100% - 32px); max-width: 600px
background: var(--blue-main)
border: 3px solid var(--blue-secondary)
border-radius: 12px
padding: 12px 16px
box-shadow: 0 4px 12px rgba(0,0,0,0.4), 0 8px 24px rgba(80,65,231,0.3)
z-index: 1000
```

Transition: `transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease`
Hidden: `translateY(-120%); opacity: 0; pointer-events: none`

Contents: logo left + social icons | wallet/account button right. Always a single row, no wrapping.

Because the header is fixed, `div.app` has `padding-top: 72px` to prevent content from hiding underneath it.

---

## Status & Feedback Messages

### Error

```
background: rgba(255, 47, 31, 0.1)
border: 1px solid var(--red)
color: var(--red)
padding: 12px 16px
border-radius: 8px
font-size: 14px
```

### Success

```
background: rgba(50, 200, 100, 0.12)
border: 1px solid rgba(50, 200, 100, 0.4)
color: #5ddb8a
padding: 0.75rem 1rem
border-radius: 4px
font-size: 14px
```

### Loading / Empty states

Centered, color `--gray`, padding `2rem`. No borders.

---

## Divider

A decorative section separator.

```
display: flex; align-items: center; gap: 12px
margin: 32px 0 24px
```

Left/right lines: `flex: 1; height: 2px; background: linear-gradient(90deg, transparent, var(--yellow) 40%, var(--yellow) 60%, transparent); opacity: 0.5`

Center label: Xirod, `0.8rem`, `--yellow`, uppercase, `letter-spacing: 2px`

---

## Animations & Transitions

| Context               | Transition                                          |
|-----------------------|-----------------------------------------------------|
| Buttons (general)     | `all 0.2s`                                         |
| Header/menu buttons   | `all 0.18s ease`                                   |
| Sticky header slide   | `transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease` |
| Icon links (hover)    | `transform 0.2s, opacity 0.2s`                     |
| Active press scale    | `transform: scale(0.97–0.98)`                       |
| Hover lift (header buttons) | `transform: translateY(-1px)`               |
| Hover scale (icon links) | `transform: scale(1.1)`                          |

Keep animations short and snappy. Avoid easing curves longer than 0.3s for interactive elements.

---

## Special UI Components

### TV Screen (EpisodeSchedule)

A decorative CRT-TV-styled container used to display episode content. Has animated scan lines and a glowing flicker effect. This is a one-off special component — do not reuse this pattern generically.

- Outer frame: dark gradient, thick border, deep box-shadow
- Inner screen: dark radial gradient with animated `screen-glow` keyframe (blue glow flicker) and `tv-static` scanline overlay
- Mobile: reduced border thickness and height (500px vs 700px desktop)

### Countdown Timer

Standalone `<CountdownTimer />` component. Lives outside of cards, below them, as a dramatic standalone element.

---

## Accessibility Notes

- All interactive icon links must have `aria-label`
- Disabled buttons must have `disabled` attribute (not just visual opacity)
- Focus states on inputs use `border-color: var(--blue-main)` — ensure this remains visible
- `pointer-events: none` on the hidden sticky header to prevent invisible tap targets

---

## What NOT to Do

- Do not use `--background-secondary`, `--text-primary`, `#007bff`, or any external design system tokens — everything comes from our palette above
- Do not use multi-column grid layouts — the app is always a single column strip
- Do not add a solid background color to `#root` or `body` — it covers the animated background
- Do not add text-shadow to text inside dark containers — only text on the animated background needs it
- Do not use `!important` except for overriding third-party wallet adapter styles
- Do not use `rem` for font-sizes inconsistently — prefer `px` for global type scale declarations, `rem` acceptable in component-scoped CSS
