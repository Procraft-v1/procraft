# UI style guide

## Personality

Premium SaaS: calm typography, restrained motion, confident spacing. Avoid noisy gradients except hero treatments on marketing shells.

## Brand colors

Defined in `@procraft/config/theme.js` and mirrored as CSS variables in app global styles.

| Token / role        | HEX       | CSS variable |
| ------------------- | --------- | ------------ |
| Primary Navy        | `#0D1B2A` | `--pc-navy`  |
| Accent Blue actions | `#2563EB` | `--pc-blue`  |
| Cyan highlight      | `#06B6D4` | `--pc-cyan`  |
| Layout background   | `#F6F7F9` | `--pc-bg`    |
| Borders             | `#E5E7EB` | `--pc-border` |
| Muted text          | `#64748B` | `--pc-muted` |
| White surfaces      | `#FFFFFF` | `--pc-white` |

## Logo assets

React-import assets live in:

- `packages/ui/src/assets/brand/procraft-logo-mark-transparent.png`
- `packages/ui/src/assets/brand/procraft-app-icon-rounded.png`

Browser/static assets live in:

- `apps/landing/public/brand/procraft-logo-mark-transparent.png`
- `apps/landing/public/brand/procraft-app-icon-rounded.png`
- `apps/web/public/brand/procraft-logo-mark-transparent.png`
- `apps/web/public/brand/procraft-app-icon-rounded.png`
- `apps/profiles/public/brand/procraft-logo-mark-transparent.png`
- `apps/profiles/public/brand/procraft-app-icon-rounded.png`

Use `public/brand` only for browser/static references such as favicons, Open Graph images, or direct URLs. Use `packages/ui/src/assets/brand` only for React imports inside package components.

## Logo components

Import logo primitives from `@procraft/ui`:

```jsx
import { Logo, LogoMark, LogoText } from '@procraft/ui';
```

Use `Logo` for app chrome and branded UI:

```jsx
<Logo size={36} />
<Logo size={32} showText={false} />
<Logo size={40} textColor="#FFFFFF" />
```

The Procraft wordmark is normal rendered text, not an image. Do not create or use an image wordmark unless brand guidelines are explicitly updated.

## Favicon usage

Each app uses the public app icon:

```html
<link rel="icon" type="image/png" href="/brand/procraft-app-icon-rounded.png" />
<link rel="apple-touch-icon" href="/brand/procraft-app-icon-rounded.png" />
```

## Component geometry

| Property       | Value / rule                                           |
| -------------- | ------------------------------------------------------ |
| Card radius    | `12px` via Ant Design `borderRadius` token             |
| Elevation      | Soft shadows `0 14px 30px rgb(13 27 42 / 6%)` baseline |
| Spacing rhythm | 8-point grid: `16`, `24`, `32`, `48`, `96` px steps    |

## Typography

Use the shared Ant Design theme font family:

`Inter, Manrope, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`

Dashboard headings use `Title` levels 4-3 for contextual sections. Landing may reach display sizes via bespoke CSS clamp rules.

## Dark mode roadmap

Defer until `@procraft/store` persists theme tokens and Ant Design algorithms such as `darkAlgorithm`. Document contrast targets when activating.
