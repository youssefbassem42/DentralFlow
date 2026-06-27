---
name: DentalFlow Design System
colors:
  surface: '#f8f9ff'
  surface-dim: '#d0dbed'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e6eeff'
  surface-container-high: '#dee9fc'
  surface-container-highest: '#d9e3f6'
  on-surface: '#121c2a'
  on-surface-variant: '#3f4850'
  inverse-surface: '#27313f'
  inverse-on-surface: '#eaf1ff'
  outline: '#6f7881'
  outline-variant: '#bec7d1'
  surface-tint: '#006492'
  primary: '#006492'
  on-primary: '#ffffff'
  primary-container: '#2d9cdb'
  on-primary-container: '#003049'
  inverse-primary: '#8ccdff'
  secondary: '#006a62'
  on-secondary: '#ffffff'
  secondary-container: '#70f8e8'
  on-secondary-container: '#007168'
  tertiary: '#2c6956'
  on-tertiary: '#ffffff'
  tertiary-container: '#639f8b'
  on-tertiary-container: '#003327'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#cae6ff'
  primary-fixed-dim: '#8ccdff'
  on-primary-fixed: '#001e2f'
  on-primary-fixed-variant: '#004b6f'
  secondary-fixed: '#70f8e8'
  secondary-fixed-dim: '#4fdbcc'
  on-secondary-fixed: '#00201d'
  on-secondary-fixed-variant: '#005049'
  tertiary-fixed: '#b1efd8'
  tertiary-fixed-dim: '#96d3bd'
  on-tertiary-fixed: '#002118'
  on-tertiary-fixed-variant: '#0d503f'
  background: '#f8f9ff'
  on-background: '#121c2a'
  surface-variant: '#d9e3f6'
typography:
  display:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
  gutter: 24px
  margin: 32px
---

## Brand & Style
The design system is engineered for a high-precision medical SaaS environment, prioritizing clarity, trust, and efficiency. The aesthetic is **Modern Minimalist** with a focus on functional elegance, drawing inspiration from high-utility platforms like Linear and Stripe. 

The visual narrative avoids medical clichés in favor of a sophisticated, data-centric interface. It employs generous whitespace, a systematic grid, and subtle depth to reduce cognitive load for dental professionals. The goal is to evoke a sense of "calm productivity"—where the interface recedes to let patient data and clinical workflows take center stage.

## Colors
This design system utilizes a palette rooted in "Dental Blue" to establish immediate professional credibility. 

- **Primary & Secondary:** Used for core actions and brand moments. Primary Blue is reserved for high-intent actions (e.g., "Save Appointment"), while Teal is used for secondary pathways or data visualization.
- **Surface Strategy:** We use a layered approach. The base background is a cool-toned off-white (#F8FAFC), with components sitting on pure white (#FFFFFF) surfaces to create a natural, soft contrast without harsh lines.
- **Semantic Logic:** Success, Warning, and Danger colors are calibrated for high legibility against white backgrounds, ensuring critical medical alerts are unmistakable.

## Typography
The system relies exclusively on **Inter** to achieve a crisp, systematic feel. The type hierarchy is highly structured to handle complex medical data.

- **Tracking:** Use slight negative letter-spacing (-1% to -2%) for display and headline styles to maintain a tight, modern "Linear-like" feel.
- **Contrast:** High-level headers use the Neutral #1F2937 for maximum authority. Secondary labels and "de-emphasized" information should use a 60% opacity of the neutral color.
- **Utility:** Monospaced numbers (tnum) should be enabled for data tables and clinical measurements to ensure vertical alignment.

## Layout & Spacing
This design system is built on an **8px linear grid**. All dimensions, padding, and margins must be multiples of 8 to ensure a rhythmic, predictable layout.

- **Grid Model:** A 12-column fluid grid is used for desktop (max-width: 1440px). For tablet, transition to 8 columns. For mobile, use a 4-column fluid grid.
- **Density:** Provide two density modes for the interface: "Standard" (16px/24px padding) for patient intake and marketing views, and "Compact" (8px/12px padding) for clinical charts and data-heavy scheduling views.
- **Alignment:** Consistent 24px gutters provide enough "breathing room" to maintain the premium, high-trust feel of the brand.

## Elevation & Depth
The system uses **Tonal Layers** combined with **Ambient Shadows** to define hierarchy. 

- **Level 0 (Base):** #F8FAFC. For the main application background.
- **Level 1 (Card):** White surface with a 1px border (#E5E7EB) and a subtle "Soft Shadow": `0px 1px 3px rgba(0,0,0,0.05), 0px 4px 6px rgba(0,0,0,0.02)`.
- **Level 2 (Dropdowns/Modals):** White surface with a more pronounced elevation: `0px 10px 15px -3px rgba(0,0,0,0.1), 0px 4px 6px -2px rgba(0,0,0,0.05)`.
- **Level 3 (Overlays):** Used for critical alerts, utilizing a 40% opacity neutral backdrop blur to maintain context while focusing attention.

## Shapes
A consistent `12px` (rounded-lg) radius is applied to all primary containers and cards to soften the technical nature of the software. Smaller elements like buttons and input fields follow an `8px` (rounded-md) standard to maintain a crisp, professional edge.

- **Exceptions:** Checkboxes use a `4px` radius. Avatars and status "Pills" are always fully rounded (pill-shaped).

## Components
- **Buttons:** Primary buttons use a solid Dental Blue fill with white text. Secondary buttons use a white fill with a 1px border (#E5E7EB) and Neutral text. Hover states should involve a subtle shift in brightness (darken 5%) rather than a color change.
- **Data Tables:** High-precision styling. Use `label-sm` for headers (all caps, muted color). Rows should have a 1px bottom border only, with a subtle background highlight (#F1F5F9) on hover.
- **Badges:** High-contrast for status. Use "Ghost" style (light background tint + dark text of the same hue) for low-priority status, and solid fills for critical alerts.
- **Input Fields:** 1px #E5E7EB border that transitions to 2px Primary Blue on focus. Use #F8FAFC for disabled states.
- **Transitions:** All interactive elements (hover, focus, active) must use a `200ms ease-out` transition to mirror the "smooth" experience of premium SaaS platforms.