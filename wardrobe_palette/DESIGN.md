---
name: Wardrobe Palette
colors:
  surface: '#f9f9fc'
  surface-dim: '#dadadc'
  surface-bright: '#f9f9fc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f6'
  surface-container: '#eeeef0'
  surface-container-high: '#e8e8ea'
  surface-container-highest: '#e2e2e5'
  on-surface: '#1a1c1e'
  on-surface-variant: '#454652'
  inverse-surface: '#2f3133'
  inverse-on-surface: '#f0f0f3'
  outline: '#757684'
  outline-variant: '#c5c5d4'
  surface-tint: '#4355b9'
  primary: '#24389c'
  on-primary: '#ffffff'
  primary-container: '#3f51b5'
  on-primary-container: '#cacfff'
  inverse-primary: '#bac3ff'
  secondary: '#52625b'
  on-secondary: '#ffffff'
  secondary-container: '#d5e7de'
  on-secondary-container: '#586861'
  tertiary: '#434341'
  on-tertiary: '#ffffff'
  tertiary-container: '#5b5a58'
  on-tertiary-container: '#d4d2cf'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dee0ff'
  primary-fixed-dim: '#bac3ff'
  on-primary-fixed: '#00105c'
  on-primary-fixed-variant: '#293ca0'
  secondary-fixed: '#d5e7de'
  secondary-fixed-dim: '#b9cac2'
  on-secondary-fixed: '#0f1e19'
  on-secondary-fixed-variant: '#3a4a44'
  tertiary-fixed: '#e5e2df'
  tertiary-fixed-dim: '#c8c6c3'
  on-tertiary-fixed: '#1c1c1a'
  on-tertiary-fixed-variant: '#474745'
  background: '#f9f9fc'
  on-background: '#1a1c1e'
  surface-variant: '#e2e2e5'
typography:
  display-lg:
    fontFamily: Manrope
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-md:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
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
  unit: 4px
  container-padding-mobile: 20px
  container-padding-desktop: 40px
  gutter: 16px
  stack-sm: 8px
  stack-md: 24px
  stack-lg: 48px
---

## Brand & Style

The design system is built for a premium wardrobe management experience that prioritizes clarity and visual breathing room. The brand personality is organized, sophisticated, and intentional. It aims to evoke a sense of calm and control over one's personal style, transforming the daily task of dressing into a curated ritual.

The design style is a hybrid of **Minimalism** and **Glassmorphism**. By utilizing generous whitespace (negative space) and delicate structural lines, the UI recedes into the background, allowing the user's clothing photography to become the primary visual hero. Tactile depth is introduced through subtle frosted glass elements, providing a modern, high-end feel without cluttering the interface.

## Colors

The palette is anchored by an elegant **Indigo (#3F51B5)** as the primary brand color, used sparingly for key actions and active states to maintain a high-end feel. A **Soft Sage (#8FA098)** serves as the secondary color, providing a calming, organic counterpoint for categories or secondary tags.

The background ecosystem relies on **Milk White (#F8F5F2)** for primary surfaces to reduce eye strain and provide a warmer, more "editorial" feel than pure white. Neutral grays are used for borders and secondary text, ensuring that the interface feels structured but lightweight. 

- **Primary:** Indigo for intent and branding.
- **Secondary:** Sage for natural, soft accents.
- **Surface:** Milk White for a premium, textured canvas.
- **Ink:** Deep Neutral for high-legibility typography.

## Typography

The typography system uses **Manrope** for headlines to convey a modern, balanced, and refined character. For functional body text and interface labels, **Inter** provides a systematic and highly legible experience.

Visual hierarchy is achieved through significant weight contrast and deliberate use of uppercase tracking for labels. 
- **Headlines:** Should be set with tight letter-spacing to feel "locked" and authoritative.
- **Body Text:** Uses a slightly increased line-height to ensure the interface feels airy and readable.
- **Labels:** Small caps are used for metadata (e.g., fabric types, seasons) to differentiate from interactive text.

## Layout & Spacing

The layout follows a **fluid grid** philosophy with generous inner margins to create a "gallery" effect. 

- **Mobile:** A 2-column or 3-column grid is standard for item browsing to maximize image size. Side margins are set to 20px to prevent content from feeling cramped against the screen edges.
- **Desktop:** Transition to a 12-column grid with centered content max-width.
- **Rhythm:** Use an 8px base grid for spacing between elements, but use "Macro-spacing" (48px+) between major sections to emphasize the minimalist aesthetic and provide "room to breathe."

## Elevation & Depth

This design system eschews traditional heavy shadows in favor of **Tonal Layering** and **Glassmorphism**.

1.  **Base Layer:** Milk White (#F8F5F2) solid background.
2.  **Mid Layer:** Cards use a 1px solid border (#E0E0E0) instead of shadows to maintain a "pure" look.
3.  **Floating Layer:** Primary Action Buttons and Navigation Bars utilize a **Backdrop Blur (20px - 30px)** with a 70% white tint. This creates a "frosted glass" effect that allows clothing colors to peak through as the user scrolls.
4.  **Interaction:** On hover or tap, elements should slightly scale (1.02x) rather than increasing shadow depth, maintaining the tactile yet flat aesthetic.

## Shapes

The shape language is consistently **Rounded**, reflecting the soft nature of textiles and clothing. 

- **Cards & Images:** Use a 16px (1rem) corner radius to soften the grid.
- **Inputs:** Use an 8px radius for a more structured, functional feel.
- **Buttons:** Small buttons use 8px, while Floating Action Buttons (FABs) are fully pill-shaped (rounded-full).
- **Dividers:** Horizontal lines should be 0.5px or 1px thick in a soft neutral grey, never spanning the full width of the screen—leave 20px margins on both sides for a more sophisticated "floating" line effect.

## Components

- **Wardrobe Cards:** Minimalist containers for clothing items. No visible text on the grid view; labels appear only on long-press or in the detail view to keep the focus on the photography.
- **Glass FAB:** A floating action button with a frosted glass background and a thin Indigo icon. Located at the bottom center for easy thumb access.
- **Status Chips:** Small, low-contrast pills (Sage or Gray background) for tagging items (e.g., "Summer," "Formal").
- **Segmented Control:** For toggling between "Closet" and "Outfits," use a pill-shaped toggle with a subtle sliding background.
- **Outfit Canvas:** A dedicated space with no grid lines where users can freely arrange clothing "stickers" to create lookbooks, utilizing a very light gray background to distinguish it from the browsing mode.
- **Inputs:** Underlined or lightly boxed inputs with Manrope medium labels. Focus state is indicated by a color shift to Indigo in the border only.