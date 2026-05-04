# `@procraft/api`

Lowest frontend HTTP layer: shared Axios instance, `withCredentials: true`, CSRF-ready headers, interceptors.

## Belongs here

- Axios instance creation and shared interceptors  
- Cookie-based session compatibility (cookies set by backend; **not** `localStorage` tokens)  
- Error normalization helpers

## Do **not** place here

- Endpoint-specific functions (`packages/services`)  
- TanStack Query (`packages/hooks`)  
- React components

## Forbidden for app components

Applications and `packages/ui` **must not** import this package directly — use **`packages/services` → `packages/hooks`**.
