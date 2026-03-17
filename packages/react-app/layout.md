# Earnbase Design System

This document outlines the design tokens and aesthetic guidelines for the Earnbase platform.

## Color Palette

### Celo Brand Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `celo-yellow` | `#FCFF52` | Primary buttons, headers, accents |
| `celo-forest` | `#4E632A` | Secondary buttons, success states, accents |
| `celo-purple` | `#1A0329` | Contrast elements, dark backgrounds, accents |
| `celo-lt-tan` | `#FBF6F1` | Primary page background |
| `celo-dk-tan` | `#E6E3D5` | Card backgrounds, hover states |
| `celo-orange` | `#F29E5F` | Warning states, verification requirements |
| `celo-lime` | `#B2EBA1` | Success backgrounds |
| `celo-blue` | `#8AC0F9` | Informational elements |
| `celo-success` | `#329F3B` | Positive feedback, reward text |
| `celo-error` | `#E70532` | Error states, dangerous actions |

## Typography

### Font Families
- **GT Alpina**: Premium serif font used for headings (`font-gt-alpina`).
- **Inter**: Clean sans-serif font used for body text and UI elements (`font-inter`).
- **Licorice**: Decorative cursive font for special accents (`font-licorice`).

### Sizes & Hierarchy
| Token | Size | Description |
|-------|------|-------------|
| `text-h1` | 72px | Hero titles |
| `text-h2` | 54px | Section headers |
| `text-h3` | 48px | Sub-headers |
| `text-h4` | 40px | Component titles |
| `text-body-l` | 20px | Large body text |
| `text-body-m` | 16px | Standard body text |
| `text-body-s` | 14px | Small body text / descriptions |
| `text-eyebrow` | 12px | Label text, meta info |

## UI Components & Aesthetics

### Borders
- **Heavy**: `border-4 border-black` for primary containers and buttons.
- **Medium**: `border-2 border-black` for inputs and secondary elements.

### Shadows
Earnbase uses "Brutalism-lite" hard shadows:
- `shadow-[4px_4px_0_0_rgba(0,0,0,1)]`
- `shadow-[8px_8px_0_0_rgba(0,0,0,1)]`

### Border Radii
- Full-page headers: `rounded-b-3xl`
- Primary cards: `rounded-2xl`
- Standard containers: `rounded-xl`
- Buttons: Often square or slightly rounded.

### Animations
- Transition duration: `duration-300`
- Scaling on click: `active:scale-95`
- Hover effects: Scale up or color shift.
