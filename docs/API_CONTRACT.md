# API contract

Everything is prefixed with `/api` at the edge reverse proxy (`VITE_API_URL=/api`). JSON bodies use `camelCase`.

## Conventions

- Auth: access and refresh material are issued only as HttpOnly cookies. JSON responses intentionally omit tokens; clients must not use `localStorage` for credentials.
- Errors: exceptions map to JSON with `Content-Type: application/json`:
  - 400 `{ "message": "Validation failed", "errors": { "<field>": ["..."] } }`
  - 401 `{ "message": "..." }`
  - 409 `{ "message": "Conflict", "errors": { ... } }`
  - 404 `{ "message": "..." }`
  - 500 `{ "message": "An unexpected error occurred." }`
- Operational health:
  - `GET /health` is intentionally outside `/api`.

## Authentication (`/api/auth`)

All responses below set or clear cookies via `Infrastructure.Auth.CookieService`. Responses never include JWT or refresh token strings in JSON.

| Method and path | Body | Success response |
| --- | --- | --- |
| `POST /api/auth/register` | `{ "email": string, "username": string, "password": string }` | `{ "user": AuthUserDto }` + cookies |
| `POST /api/auth/login` | `{ "emailOrUsername": string, "password": string }` | `{ "user": AuthUserDto }` + cookies |
| `GET /api/auth/me` | none | `{ "user": AuthUserDto }`; requires valid access JWT. |
| `POST /api/auth/refresh` | none | `{ "user": AuthUserDto }` + rotated cookies |
| `POST /api/auth/logout` | none | `{ "message": "Logged out successfully" }` + cleared cookies |

`AuthUserDto` fields: `id`, `email`, `username`, `isEmailConfirmed`.

## Profiles + catalogs

| Area | Prefix | Remarks |
| --- | --- | --- |
| Owner profile | `GET /api/profile/me`, `POST /api/profile`, `PUT /api/profile` | Authenticated; returns `ProfileDto`. |
| Public view | `GET /api/profile/{username}` | Returns public `ProfileDto` with `templateSlug`. |
| Profile avatar | `POST /api/profile/avatar`, `DELETE /api/profile/avatar` | Authenticated; multipart upload/clear flow. |
| Skills | `/api/profile/skills` | Authenticated owner CRUD. |
| Projects | `/api/profile/projects` | Authenticated owner CRUD. |
| Experiences | `/api/profile/experiences` | Authenticated owner CRUD. |
| Education | `/api/profile/educations` | Authenticated owner CRUD. |
| Certificates | `/api/profile/certificates` | Authenticated owner CRUD. |
| Social links | `/api/profile/social-links` | Authenticated owner CRUD. |
| Custom sections | `/api/profile/custom-sections` | Authenticated owner CRUD. |
| Templates | `GET /api/templates` | Active template catalog |
| Analytics | `GET /api/analytics/summary` | Future analytics scope |
| PDF | `POST /api/pdf/export` | Future PDF scope |
| Subscription | `GET /api/subscriptions/me` | Entitlements |

`ProfileDto` fields include `id`, `userId`, `templateId`, `username`, `fullName`, `title`, `bio`, `location`, `website`, `avatarUrl`, `templateSlug`, `createdAt`, and `updatedAt`.

### Profile avatar upload

- `POST /api/profile/avatar`
  - Requires authentication.
  - Content type: `multipart/form-data`.
  - File field name: `file`.
  - Allowed formats: JPG, JPEG, PNG, WEBP.
  - Max file size: 5MB.
  - Success response: updated `ProfileDto`.
- `DELETE /api/profile/avatar`
  - Requires authentication.
  - Deletes the stored avatar file when present.
  - Clears `avatarUrl`.
  - Success response: updated `ProfileDto`.

Avatar files are stored on disk, never in the database. The profile stores only the public URL, shaped as `/uploads/avatars/{filename}`.

### Profile child sections

All child section endpoints require authentication and operate only on the current user's profile. Controllers send MediatR requests; responses are DTOs only.

| Section | Methods and path | Request fields |
| --- | --- | --- |
| Skills | `GET /api/profile/skills`, `POST /api/profile/skills`, `PUT /api/profile/skills/{id}`, `DELETE /api/profile/skills/{id}` | `name`, `level`, `category`, `sortOrder` |
| Projects | `GET /api/profile/projects`, `POST /api/profile/projects`, `PUT /api/profile/projects/{id}`, `DELETE /api/profile/projects/{id}` | `name`, `description`, `githubUrl`, `liveUrl`, `sortOrder` |
| Work experiences | `GET /api/profile/experiences`, `POST /api/profile/experiences`, `PUT /api/profile/experiences/{id}`, `DELETE /api/profile/experiences/{id}` | `company`, `position`, `description`, `startDate`, `endDate`, `isCurrent`, `sortOrder` |
| Educations | `GET /api/profile/educations`, `POST /api/profile/educations`, `PUT /api/profile/educations/{id}`, `DELETE /api/profile/educations/{id}` | `institution`, `degree`, `field`, `startDate`, `endDate`, `sortOrder` |
| Certificates | `GET /api/profile/certificates`, `POST /api/profile/certificates`, `PUT /api/profile/certificates/{id}`, `DELETE /api/profile/certificates/{id}` | `name`, `issuer`, `issuedOn`, `url`, `sortOrder` |
| Social links | `GET /api/profile/social-links`, `POST /api/profile/social-links`, `PUT /api/profile/social-links/{id}`, `DELETE /api/profile/social-links/{id}` | `platform`, `url`, `sortOrder` |
| Custom sections | `GET /api/profile/custom-sections`, `POST /api/profile/custom-sections`, `PUT /api/profile/custom-sections/{id}`, `DELETE /api/profile/custom-sections/{id}` | `title`, `content`, `sortOrder` |

Validation highlights:

- Skills: `name` is required; `level` must be 1-5; `category` is max 50 chars.
- Projects: `name` is required; `description` is max 1000 chars; URL fields are max 255 chars.
- Work experiences: `company`, `position`, and `startDate` are required; `endDate` can be null when `isCurrent` is true.
- Educations: `institution` is required; `degree` and `field` are max 100 chars.
- Certificates: `name` is required; `issuer` is max 100 chars; `url` is max 255 chars.
- Social links: `platform` and `url` are required; `url` is max 255 chars.
- Custom sections: `title` and `content` are required.

Swagger UI in the `Development` profile publishes OpenAPI artifacts; treat schemas as illustrative until stabilized.
