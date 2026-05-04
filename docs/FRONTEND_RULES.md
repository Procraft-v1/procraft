# Frontend rules

These guardrails preserve maintainability across three Vite apps + shared workspace packages.

## Dependency matrix

| Package / app        | Allowed imports                                       | Forbidden imports                     |
| -------------------- | ----------------------------------------------------- | ------------------------------------- |
| `apps/*`             | All `@procraft/*`, React ecosystem                    | Raw `axios.create` bypassing `@procraft/api-client` |
| `@procraft/hooks`    | `@procraft/services`, `@tanstack/react-query`       | Axios, UI components heavy logic    |
| `@procraft/services`| `@procraft/api-client`                                | React, Redux, Hooks                  |
| `@procraft/api-client` | `@procraft/config`                                  | Business rules                      |
| `@procraft/ui`       | `@procraft/config`, presentational helpers            | `@procraft/hooks`, `@procraft/services`, Axios |
| `@procraft/store`    | `@reduxjs/toolkit` minimal                            | Server cache, JWT storage            |

## Auth + security

1. Tokens never touch `localStorage` / Redux.
2. All credentialed calls use Axios `withCredentials: true`.
3. CSRF-aware unsafe verbs send `X-CSRF-TOKEN` after backend strategy finalizes (`packages/api-client/src/csrf.js`).
4. Components never import Axios directly — always descend through hooks.

## Internationalization & theming

- Copy stored in `@procraft/i18n`; apps call `configureI18n()` before mounts.
- Ant Design tokens originate from `@procraft/config/theme.js` (`ConfigProvider` per app roots).
