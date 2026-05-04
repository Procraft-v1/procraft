# `@procraft/services`

**Endpoint-only** callers over the shared Axios client.

## Dependency flow

Services import **`@procraft/api` only**, never TanStack Query or React.

## Belongs here

- One module per bounded context with HTTP verbs calling stable paths aligned with [`docs/API_CONTRACT.md`](../../docs/API_CONTRACT.md).

## Do **not** place here

- UI, hooks, Redux, or direct Axios construction (`axios.create`).  
- Synthetic “demo” payloads or mocks that impersonate backend responses.
