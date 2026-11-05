// Shrinks the pictures in client/public/images WITHOUT renaming them (same file names, same format),
// so no code or database path has to change.
//
//   npm install                      (once, installs "sharp")
//   npm run optimize:images          -> dry run: only prints how much each file would shrink
//   npm run optimize:images -- --write   -> really overwrites the files (commit first, so you can undo with git)
//
// Options: --no-palette  keep full PNG colours (bigger files, but no banding on smooth gradients)
import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public/images');
const WRITE = process.argv.includes('--write');
const PALETTE = !process.argv.includes('--no-palette');

// cards / thumbnails / avatars are never shown bigger than this, so there is no point keeping 3000px files
const SMALL_FOLDERS = /(^|[\\/])(courses|categories|teachers|instructors|reviewers|live-classes)[\\/]/i;
const SMALL_MAX = 900;
const BIG_MAX = 1920; // banners / backgrounds

const walk = async (dir) => {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (/\.(png|jpe?g)$/i.test(entry.name)) out.push(full);
  }
  return out;
};

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;

const files = await walk(ROOT).catch(() => {
  console.error(`Folder not found: ${ROOT}`);
  process.exit(1);
});

let before = 0;
let after = 0;

for (const file of files) {
  const original = await readFile(file);
  const rel = path.relative(ROOT, file);
  const max = SMALL_FOLDERS.test(file) ? SMALL_MAX : BIG_MAX;
  const isPng = /\.png$/i.test(file);

  const image = sharp(original, { failOn: 'none' }).rotate().resize({ width: max, withoutEnlargement: true });
  const output = await (isPng
    ? image.png({ palette: PALETTE, quality: 80, effort: 10, compressionLevel: 9 })
    : image.jpeg({ quality: 80, mozjpeg: true })
  ).toBuffer();

  const keep = output.length < original.length; // never make a file bigger
  const final = keep ? output : original;
  before += original.length;
  after += final.length;
  console.log(`${keep ? '✓' : '·'} ${rel.padEnd(48)} ${kb(original.length).padStart(8)} -> ${kb(final.length).padStart(8)}`);

  if (WRITE && keep) await writeFile(file, output);
}

console.log(`\n${files.length} files: ${kb(before)} -> ${kb(after)} (${before ? Math.round((1 - after / before) * 100) : 0}% smaller)`);
console.log(WRITE ? 'Files were overwritten.' : 'Dry run only. Add --write to overwrite the files.');
