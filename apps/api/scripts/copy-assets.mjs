// Copies non-TypeScript runtime assets that `tsc` does not emit on its own.
// Currently: the embedded PDF fonts used for Cyrillic resume rendering.
// Runs cross-platform (local Windows build + Docker linux build) after `tsc`.
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const assets = [['src/pdf/fonts', 'dist/pdf/fonts']];

for (const [from, to] of assets) {
  const src = join(root, from);
  const dest = join(root, to);

  if (!existsSync(src)) {
    console.warn(`[copy-assets] skip missing ${from}`);
    continue;
  }

  mkdirSync(dirname(dest), { recursive: true });
  cpSync(src, dest, { recursive: true });
  console.log(`[copy-assets] ${from} -> ${to}`);
}
