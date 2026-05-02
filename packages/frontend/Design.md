---
name: ARYA Autonomous Realtime Yield Agents
colors:
  surface: "#091520"
  surface-dim: "#060E18"
  surface-bright: "#1A3045"
  surface-container-lowest: "#040A12"
  surface-container-low: "#0C1C2C"
  surface-container: "#102232"
  surface-container-high: "#162D40"
  surface-container-highest: "#1E3A4F"
  on-surface: "#D4E8F2"
  on-surface-variant: "#8BAFC4"
  inverse-surface: "#D4E8F2"
  inverse-on-surface: "#1E3A4F"
  outline: "#4A7A94"
  outline-variant: "#2A5270"
  surface-tint: "#A8C8DC"
  primary: "#FFFFFF"
  on-primary: "#1E3A4F"
  primary-container: "#D4E8F2"
  on-primary-container: "#2A5270"
  inverse-primary: "#1E3A4F"
  secondary: "#7DD3FC"
  on-secondary: "#0C4A6E"
  secondary-container: "#1E3A4F"
  on-secondary-container: "#7DD3FC"
  tertiary: "#4ADE80"
  on-tertiary: "#052E16"
  tertiary-container: "#166534"
  on-tertiary-container: "#86EFAC"
  error: "#FCA5A5"
  on-error: "#7F1D1D"
  error-container: "#991B1B"
  on-error-container: "#FECACA"
  warning: "#FCD34D"
  on-warning: "#78350F"
  primary-fixed: "#D4E8F2"
  primary-fixed-dim: "#A8C8DC"
  on-primary-fixed: "#0F2535"
  on-primary-fixed-variant: "#2A5270"
  secondary-fixed: "#BAE6FD"
  secondary-fixed-dim: "#7DD3FC"
  on-secondary-fixed: "#082F49"
  on-secondary-fixed-variant: "#0C4A6E"
  tertiary-fixed: "#BBF7D0"
  tertiary-fixed-dim: "#4ADE80"
  on-tertiary-fixed: "#052E16"
  on-tertiary-fixed-variant: "#166534"
  background: "#091520"
  on-background: "#D4E8F2"
  surface-variant: "#1A3045"
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 64px
    fontWeight: "700"
    lineHeight: 72px
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: "600"
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: "500"
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: "400"
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: "400"
    lineHeight: 22px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: "600"
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: "500"
    lineHeight: 16px
    letterSpacing: 0.04em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: "500"
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-padding: 24px
  card-gap: 16px
  section-margin: 40px
  glass-padding: 20px
components:
  glass-card-standard:
    backgroundColor: rgba(30, 58, 79, 0.15)
    textColor: "{colors.primary}"
    rounded: "{rounded.lg}"
    padding: "{spacing.glass-padding}"
  glass-card-elevated:
    backgroundColor: rgba(30, 58, 79, 0.25)
    textColor: "{colors.primary}"
    rounded: "{rounded.xl}"
    padding: "{spacing.glass-padding}"
  glass-card-stat:
    backgroundColor: rgba(212, 232, 242, 0.08)
    textColor: "{colors.primary}"
    rounded: "{rounded.xl}"
    padding: "{spacing.container-padding}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.xl}"
    height: 44px
    padding: 0 24px
  button-primary-hover:
    backgroundColor: "{colors.primary-fixed-dim}"
  button-approve:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.on-tertiary}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.xl}"
    height: 44px
    padding: 0 24px
  button-approve-hover:
    backgroundColor: "{colors.tertiary-fixed-dim}"
  button-reject:
    backgroundColor: "{colors.error}"
    textColor: "{colors.on-error}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.xl}"
    height: 44px
    padding: 0 24px
  button-ghost:
    backgroundColor: rgba(212, 232, 242, 0.05)
    textColor: "{colors.primary}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.xl}"
  button-ghost-hover:
    backgroundColor: rgba(212, 232, 242, 0.12)
  input-field:
    backgroundColor: rgba(30, 58, 79, 0.2)
    textColor: "{colors.primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.xl}"
    padding: 16px
    height: 44px
  chip-tier-bronze:
    backgroundColor: rgba(180, 83, 9, 0.2)
    textColor: "#FDE68A"
    rounded: "{rounded.full}"
    padding: 4px 12px
  chip-tier-silver:
    backgroundColor: rgba(148, 163, 184, 0.15)
    textColor: "#E2E8F0"
    rounded: "{rounded.full}"
    padding: 4px 12px
  chip-tier-gold:
    backgroundColor: rgba(234, 179, 8, 0.2)
    textColor: "#FCD34D"
    rounded: "{rounded.full}"
    padding: 4px 12px
  chip-tier-platinum:
    backgroundColor: rgba(125, 211, 252, 0.15)
    textColor: "{colors.secondary}"
    rounded: "{rounded.full}"
    padding: 4px 12px
  risk-badge-low:
    backgroundColor: rgba(74, 222, 128, 0.12)
    textColor: "{colors.tertiary}"
    rounded: "{rounded.full}"
    padding: 4px 10px
  risk-badge-medium:
    backgroundColor: rgba(252, 211, 77, 0.12)
    textColor: "{colors.warning}"
    rounded: "{rounded.full}"
    padding: 4px 10px
  risk-badge-high:
    backgroundColor: rgba(252, 165, 165, 0.12)
    textColor: "{colors.error}"
    rounded: "{rounded.full}"
    padding: 4px 10px
  stat-display:
    textColor: "{colors.primary}"
    typography: "{typography.display-lg}"
  stat-label:
    textColor: "{colors.on-surface-variant}"
    typography: "{typography.label-md}"
  table-row:
    backgroundColor: transparent
    textColor: "{colors.on-surface}"
    padding: 12px 16px
  table-row-hover:
    backgroundColor: rgba(212, 232, 242, 0.05)
  nav-item:
    backgroundColor: transparent
    textColor: "{colors.on-surface-variant}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.lg}"
    padding: 10px 14px
  nav-item-active:
    backgroundColor: rgba(212, 232, 242, 0.1)
    textColor: "{colors.primary}"
  nav-item-hover:
    backgroundColor: rgba(212, 232, 242, 0.06)
---

## Brand & Style

ARYA is an autonomous DeFi agent swarm presented through a **Glassmorphism** aesthetic — frosted translucent surfaces floating above a deep oceanic gradient. The design evokes the feeling of peering through crystalline layers into a live intelligence feed. The emotional tone is premium, ethereal, and technically sophisticated — a command center viewed through frosted glass.

The visual identity is derived from the ARYA logo: a geometric triangle rendered in deep navy-teal (#1E3A4F) against an icy blue (#D4E8F2) field. This translates into a dark oceanic background with layered frosted glass panels. The brand colors appear as luminous accents glowing through translucent surfaces — the navy-teal deepens the backdrop while the icy blue radiates as the primary interactive accent.

The UI uses transparency and blur to simulate physical depth. Data-dense DeFi content (yield tables, risk radars, agent recommendations) sits on frosted panels that separate cleanly from the atmospheric background, maintaining readability without sacrificing the immersive glass aesthetic.

## Colors

The color strategy prioritizes **luminosity against depth**. The background is a rich, multi-stop gradient in the navy-teal family, while UI components use frosted white and blue alpha channels to maintain legibility and the glass illusion.

- **Primary Canvas:** A multi-stop radial gradient background from Deep Ocean (#040A12) through Navy Teal (#1E3A4F) to Dark Petrol (#0C4A6E), with subtle animated grain.
- **Surface Alpha:** Component backgrounds are never solid. They range from `rgba(30, 58, 79, 0.15)` for standard cards to `rgba(30, 58, 79, 0.25)` for elevated/focal panels.
- **Secondary (#7DD3FC):** Luminous sky blue for interactive accents — links, active states, charts, and data highlights. Appears to glow against the dark glass.
- **Tertiary (#4ADE80):** Signal green for positive outcomes — approved strategies, profit indicators, healthy positions.
- **Error (#FCA5A5):** Soft coral for rejected strategies and high-risk states. Applied with low-opacity fills to maintain glass coherence.
- **Warning (#FCD34D):** Warm amber for pending states and medium-risk indicators.
- **Text:** Strictly white (#FFFFFF) for primary content or high-tint icy blue (#D4E8F2) for body text. Ensures WCAG compliance against translucent backgrounds.

Semantic mapping: green = approved/profit/low-risk, amber = pending/caution/medium-risk, coral = rejected/loss/high-risk. These correspond directly to `StrategyVault.sol` status lifecycle and `AgentReputation.sol` tier colors.

## Typography

The design system uses **Inter** for its neutral, geometric clarity — the clean geometry balances the organic fluidity of the blurred glass surfaces. **JetBrains Mono** provides the technical precision needed for on-chain data.

- **Hierarchy:** Large display sizes (64px) for hero metrics — portfolio value, APY yields — creating a clear focal point that reads through frosted layers.
- **Legibility:** On glass surfaces, font weight is increased by one tier (Medium instead of Regular) to counteract the visual noise of the background blur.
- **Body Text:** Set at Inter Regular 14px for information density. The slight letter-spacing at label sizes aids scanning across data tables.
- **Mono Data:** JetBrains Mono at 11px for wallet addresses, transaction hashes, and contract values. Its geometric monospace construction evokes terminal precision.
- **Treatment:** Subtle text-shadows (`0px 2px 4px rgba(0,0,0,0.2)`) applied to display-size text to ensure it "lifts" against lighter blur areas.

## Layout & Spacing

The layout follows a fluid, contextual model. Elements are grouped into **Glass Containers** that float within the viewport, with generous negative space revealing the atmospheric gradient beneath.

- **Rhythm:** An 8px base grid governs all dimensions.
- **Sidebar:** Fixed left navigation panel — itself a frosted glass surface with `backdrop-filter: blur(20px)`. Collapses to icon-only on narrow viewports.
- **Content Grid:** Metric cards arranged in CSS grid with 16px gaps. Dashboard uses 3-column stat row with full-width data table below.
- **Negative Space:** Generous outer margins (24px+) ensure the gradient background is visible between panels, reinforcing the "floating" glass aesthetic.
- **Strategy Detail:** Single-column layout with stacked glass panels — risk radar, agent recommendations, swap route, approval actions — each panel separated by 16px of visible background.
- **Max width:** Content area capped at 1280px, centered on wide viewports.

## Elevation & Depth

Depth is not achieved through darkness or heavy shadows, but through the **physics of light and refraction** — blur intensity and alpha channels create a believable glass stack.

- **The Glass Stack:**
  - **Level 0 (Background):** Deep oceanic gradient with subtle animated grain texture. This is the "atmosphere" — always visible through and between glass panels.
  - **Level 1 (Standard Card):** `backdrop-filter: blur(20px)`, `background: rgba(30, 58, 79, 0.15)`. Standard content containers — opportunity rows, metric cards, agent panels.
  - **Level 2 (Elevated/Modals):** `backdrop-filter: blur(40px)`, `background: rgba(30, 58, 79, 0.25)`. Strategy detail overlays, approval modals, expanded views.
  - **Level 3 (Popovers/Tooltips):** `backdrop-filter: blur(60px)`, `background: rgba(30, 58, 79, 0.35)`. Highest clarity — maximum blur, most opacity.

- **Edge Definition:** Every glass surface must have a 1px solid border at `rgba(212, 232, 242, 0.12)`. A secondary inner "shine" border (top and left only, `rgba(255, 255, 255, 0.06)`) simulates a light source from the upper-left.
- **Shadows:** Extremely soft, spread-out shadows (`box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.15)`) to separate glass layers without breaking the translucent illusion.

## Shapes

The shape language is organic and fluid — generous rounding complements the frosted glass surfaces and echoes the curved refraction patterns of real glass.

- **Cards and glass containers:** `1rem` (16px) border radius.
- **Action Elements:** Buttons and inputs use `rounded-xl` (1.5rem / 24px) for a soft, tactile, pill-like feel.
- **Chips and badges:** Full pill (9999px) — tier badges, risk labels, status indicators.
- **Charts:** Rounded line caps, 2px stroke weight. Area fills use smooth gradients.
- **Icons:** Lucide icon set — line-based with rounded caps (1.5px stroke weight), matching the border weights of glass containers.
- **The ARYA Triangle:** The logo's geometric triangle motif may appear as subtle decorative accents in empty states or loading screens — never competing with content.

## Components

### Glass Containers

Standard cards use a 20px blur for general metrics (opportunity list, agent cards), while elevated surfaces (strategy detail panels, approval modals) use 40px blur and higher opacity to sit physically higher in the stack. All glass elements must feature the 1px icy-blue border (`rgba(212, 232, 242, 0.12)`) to simulate light refraction on edges. A subtle inner glow on the top-left edge completes the physical illusion.

### Action Elements

Buttons use `rounded-xl` to maintain the soft organic feel. The primary "Approve Strategy" button is solid white for maximum contrast and clear call-to-action. "Reject" uses soft coral. Ghost buttons (secondary actions, navigation) use backdrop filters to remain integrated with the glass surface beneath. All interactive elements gain a brighter border and subtle scale transform on hover.

### Stat Displays

Hero metrics (Total APY, Portfolio Value, Win Rate) use the `display-lg` typography at 64px white, with a subtle text-shadow for legibility. Beneath each value, a muted label in `on-surface-variant` identifies the metric. The glass-card-stat component uses an even more transparent alpha (`0.08`) so the number floats prominently.

### Risk Indicators

Risk is shown through color-coded pill badges using semi-transparent backgrounds that harmonize with the glass aesthetic. The Strategy Detail risk radar uses a frosted panel with the pentagon grid rendered in `outline-variant`, filled area in `secondary` at 15% opacity, stroke in `secondary`.

### Tier Badges

Agent tier progression (Bronze → Silver → Gold → Platinum) uses pill chips with alpha-channel backgrounds. Each tier glows with its signature color through the translucent surface — bronze amber, silver steel, gold warm yellow, platinum icy blue.

### Data Tables

Opportunity feeds and execution history render on glass surfaces with minimal internal borders. Row hover states use `rgba(212, 232, 242, 0.05)` — a barely-there highlight that feels like light catching the glass. Monospace font for addresses and amounts. Alternating rows are not used; the glass surface provides sufficient visual grouping.

### Navigation

The sidebar is itself a glass panel with 20px blur. Nav items use icon + label. Active state applies a brighter glass fill (`rgba(212, 232, 242, 0.1)`) with white text. Inactive items use the muted `on-surface-variant` color. On hover, items gain a subtle fill (`rgba(212, 232, 242, 0.06)`), simulating light shifting across the frosted surface.

### Charts (Recharts)

- **Area charts:** Gradient fill from `secondary` (15% opacity at top) to transparent. Stroke in `secondary`. Grid lines in `outline-variant` at 30% opacity.
- **Risk radar:** Pentagon grid in `outline-variant`. Filled area in `secondary` at 15% opacity, stroke in `secondary-fixed-dim`.
- **Bar charts:** `secondary-container` for bars, `tertiary` for profit/positive comparison.
- **Tooltips:** Glass surface (`backdrop-filter: blur(20px)`, `rgba(30, 58, 79, 0.3)`) with 1px border. Text in white.
- **Animations:** Smooth entry transitions (300ms ease-out) on initial load only. No continuous animation on live data.

### Inputs & Interaction

Text inputs and search fields use the glass treatment — `rgba(30, 58, 79, 0.2)` background with 20px blur. On focus, the border brightens to `secondary` and a subtle glow (`box-shadow: 0 0 0 2px rgba(125, 211, 252, 0.15)`) appears. Placeholder text uses `on-surface-variant`.

## Do's and Don'ts

- Do maintain the glass illusion — never use fully opaque backgrounds on content panels
- Do ensure the atmospheric gradient is visible between and behind glass surfaces
- Do use `backdrop-filter: blur()` on every elevated surface — this is the core visual technique
- Do apply the 1px translucent border on all glass elements to simulate edge refraction
- Don't use heavy drop shadows — they break the translucent illusion
- Do use monospace font exclusively for on-chain data (addresses, hashes, amounts)
- Don't mix rounded-lg (cards) and rounded-xl (buttons) within the same component
- Do increase font weight by one tier when text sits on a blurred surface
- Don't use more than 3 semantic colors in a single visualization
- Do truncate wallet addresses to `0x1234...5678` format in non-detail views
- Don't animate data that refreshes frequently — stable numbers are scannable
- Do provide frosted skeleton loaders (pulsing glass panels) rather than spinners
- Do apply subtle text-shadow to display-size typography for legibility against blur
- Don't place glass-on-glass without sufficient blur differential between layers
