# `@procraft/hooks`

TanStack Query wrappers: **hooks call `@procraft/services`** only — never Axios or `@procraft/api` directly.

## Belongs here

`useQuery` / `useMutation` modules grouped by bounded context.

## Forbidden

- JSX (except negligible error boundaries delegated to apps later)  
- Direct HTTP client imports  
- Storing JWTs / refresh bodies in Redux
