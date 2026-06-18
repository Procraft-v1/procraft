# Embedded PDF fonts

`NotoSans-Regular.ttf` / `NotoSans-Bold.ttf` — Noto Sans (hinted static TTF).

Used by `pdf.service.ts` to render Cyrillic (Russian) resumes, because pdfkit's
built-in Helvetica only covers Latin-1 (WinAnsi) and drops Cyrillic glyphs.
Uzbek/English resumes keep the built-in Helvetica, so their output is unchanged.

- Source: https://github.com/notofonts/notofonts.github.io (NotoSans/hinted/ttf)
- License: SIL Open Font License 1.1 — https://openfontlicense.org

These files are copied to `dist/pdf/fonts/` by the `build` script (see
`scripts/copy-assets.mjs`) so they are present at runtime in the Docker image.
