# Applications workspace

Each top-level SPA/API ships independently (`pnpm --filter … <script>`):

| Folder      | Responsibility                               |
| ----------- | -------------------------------------------- |
| `landing`   | SEO marketing                                |
| `web`       | Auth + dashboards                            |
| `profiles`  | Portfolio rendering on profile subdomains   |
| `api`       | ASP.NET Core gateway + Clean Architecture layers |
