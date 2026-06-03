---
name: Serene Pediatrics
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#3d4947'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#6d7a77'
  outline-variant: '#bcc9c6'
  surface-tint: '#006a61'
  primary: '#00685f'
  on-primary: '#ffffff'
  primary-container: '#008378'
  on-primary-container: '#f4fffc'
  inverse-primary: '#6bd8cb'
  secondary: '#545f73'
  on-secondary: '#ffffff'
  secondary-container: '#d5e0f8'
  on-secondary-container: '#586377'
  tertiary: '#825100'
  on-tertiary: '#ffffff'
  tertiary-container: '#a36700'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#89f5e7'
  primary-fixed-dim: '#6bd8cb'
  on-primary-fixed: '#00201d'
  on-primary-fixed-variant: '#005049'
  secondary-fixed: '#d8e3fb'
  secondary-fixed-dim: '#bcc7de'
  on-secondary-fixed: '#111c2d'
  on-secondary-fixed-variant: '#3c475a'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  headline-xl:
    fontFamily: Hanken Grotesk
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style
The brand personality is empathetic, professional, and reliable. It is designed to bridge the gap between clinical efficiency and the warmth required in child welfare and pediatric contexts. The target audience includes pediatricians, social workers, and administrative staff who require high legibility and a low-stress interface during critical evaluations.

The design style is **Corporate Modern with a Soft Edge**. It utilizes generous whitespace, a structured grid for data density, and softened UI elements (rounded corners and subtle shadows) to reduce the perceived "coldness" of traditional medical software. The high-contrast magenta and beige of the previous version are replaced with a calming, trustworthy palette that emphasizes accessibility and focus.

## Colors
This design system utilizes a balanced palette focused on calm and clarity:
- **Primary (Soft Teal):** `#0D9488` – Used for primary actions, success states, and progress indicators. It provides a modern, healthcare-appropriate alternative to clinical blues.
- **Secondary (Deep Navy):** `#1E293B` – Used for navigation bars, headers, and high-level typography. It establishes a grounded, professional foundation.
- **Tertiary (Warm Amber):** `#F59E0B` – A "warm accent" used sparingly for alerts, status highlights, or to draw attention to pending items without the aggression of pure red.
- **Neutral (Slate/Cloud):** Base backgrounds use `#F8FAFC`. Text remains high-contrast against this background for AAA accessibility.

The color mode is strictly **light** to maintain the bright, clean aesthetic necessary for medical documentation and to ensure maximum legibility of fine-line illustrations used in pediatric assessments.

## Typography
The system uses a combination of **Hanken Grotesk** for structural headlines and **Inter** for data and body content. 

Hanken Grotesk provides a modern, geometric clarity for page titles and section headers, while Inter's high x-height and neutral character ensure that dense patient data and form labels remain legible even on smaller displays. 

For accessibility, the minimum body size is 14px, but 16px is the preferred standard for assessment questions to reduce eye strain. All labels for form inputs utilize a semi-bold weight to clearly distinguish them from user-entered text.

## Layout & Spacing
The layout follows a **Fixed Grid** approach for desktop views to ensure patient dashboards and evaluation forms remain centered and readable, avoiding excessive line lengths. 

- **Desktop (1280px+):** 12-column grid with a max-width of 1200px. Content is centered with 40px outer margins.
- **Tablet (768px - 1279px):** 8-column fluid grid with 24px margins. 
- **Mobile (<767px):** 4-column fluid grid with 16px margins.

Spacing follows a 4px baseline, with 16px (md) being the standard padding for cards and containers. To create a "friendly" feel, vertical spacing between major sections is generous (32px or 48px), preventing the UI from feeling cluttered or overwhelming during complex evaluations.

## Elevation & Depth
This design system uses **Tonal Layers** combined with **Ambient Shadows** to create a soft, approachable sense of depth.

1.  **Level 0 (Background):** Solid `#F8FAFC`.
2.  **Level 1 (Cards/Containers):** White (`#FFFFFF`) surfaces with a very soft, diffused shadow (`0 4px 20px rgba(15, 23, 42, 0.05)`). This level is used for patient profiles and list items.
3.  **Level 2 (Modals/Popovers):** White surfaces with a more pronounced shadow (`0 10px 30px rgba(15, 23, 42, 0.1)`) and a subtle 1px border in `#E2E8F0` to ensure clear separation from the background.

Shadows should be tinted with the secondary color (Navy) at very low opacities to maintain a cohesive, sophisticated look rather than using pure black.

## Shapes
A **Rounded (2)** shape language is applied throughout the system to evoke friendliness and safety, essential for a pediatric context.

- **Buttons & Inputs:** 0.5rem (8px) corner radius.
- **Cards & Dashboard Widgets:** 1rem (16px) corner radius.
- **Status Chips & Tags:** Fully pill-shaped (rounded-full) to distinguish them from actionable buttons.

Avoid sharp corners entirely. Even within data tables, the container holding the table should utilize the standard 16px radius to maintain the "softened" brand narrative.

## Components

### Buttons
- **Primary:** Solid Teal (`#0D9488`) with white text. 
- **Secondary:** Outlined Teal or Light Navy ghost buttons for less critical actions (e.g., "Back").
- **States:** Hover states should involve a slight darkening of the fill; active states should include a subtle scale-down (98%) to provide tactile feedback.

### Input Fields
- Use a soft light gray border (`#CBD5E1`). On focus, the border transitions to Primary Teal with a 2px outer glow of the same color at 20% opacity.
- Labels are always positioned above the field, never as placeholders only, to maintain accessibility.

### Cards & Assessment Items
- Each question in an evaluation form should be contained in its own Level 1 card. 
- Use subtle teal accents for "Selected/Passed" states and soft grays for "Not Applicable" to avoid the jarring red/green contrast of traditional medical forms.

### Data Tables
- Replace heavy borders with horizontal dividers only (`#F1F5F9`).
- Header rows should use a light Navy background (`#1E293B`) with white text to provide a strong visual anchor for the data.

### Progress Indicators
- Use rounded progress bars for longitudinal tracking of child development. These should use a gradient of Primary Teal to indicate growth and health.