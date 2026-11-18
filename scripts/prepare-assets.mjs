/**
 * One-off asset preparation:
 *  1. Trims transparent padding from the supplied mascot illustrations.
 *  2. Resizes them for web use.
 *  3. Creates expression aliases, pose/state assets and PWA icons.
 *
 * The source art in Expressions-ihave/ is already transparent PNG.
 * Run with: node scripts/prepare-assets.mjs
 */
import sharp from "sharp";
import { mkdir, copyFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "Expressions-ihave");
const OUT = path.join(ROOT, "public", "mascot");

const EXPRESSIONS = [
  "happy",
  "excited",
  "curious",
  "thinking",
  "sad",
  "angry",
  "loading",
];

// Extra expressions the product spec asks for. Until dedicated artwork exists,
// reuse the closest expression so the UI never falls back to an emoji.
const EXPRESSION_ALIASES = {
  sleepy: "loading",
  surprised: "curious",
  love: "happy",
  shy: "happy",
  confused: "thinking",
  cheerful: "excited",
};

const STATE_ALIASES = {
  welcome: "excited",
  "empty-library": "curious",
  "empty-folder": "curious",
  uploading: "loading",
  "upload-success": "excited",
  processing: "loading",
  "generating-summary": "thinking",
  "no-results": "thinking",
  "file-not-found": "sad",
  error: "sad",
  "sharing-success": "happy",
  "storage-full": "sad",
};

const POSE_ALIASES = {
  "holding-files": "happy",
  uploading: "loading",
  sharing: "happy",
  reading: "happy",
  organizing: "thinking",
  searching: "curious",
  relaxing: "loading",
  celebrating: "excited",
  summarizing: "thinking",
  welcoming: "excited",
};

async function prepareMascot(input) {
  return sharp(input)
    .trim({ threshold: 1 })
    .resize({ width: 760, height: 760, fit: "inside", withoutEnlargement: true })
    .png({ compressionLevel: 9, quality: 90 })
    .toBuffer();
}

function brandSvg(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="64" y1="40" x2="448" y2="472" gradientUnits="userSpaceOnUse">
      <stop stop-color="#E9E0FB"/>
      <stop offset=".52" stop-color="#CDBDEF"/>
      <stop offset="1" stop-color="#B9A5EA"/>
    </linearGradient>
    <linearGradient id="cloud" x1="176" y1="112" x2="336" y2="344" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FFFFFF"/>
      <stop offset="1" stop-color="#F3EDFF"/>
    </linearGradient>
    <linearGradient id="folder" x1="148" y1="334" x2="390" y2="440" gradientUnits="userSpaceOnUse">
      <stop stop-color="#CDBDF3"/>
      <stop offset="1" stop-color="#A98FE4"/>
    </linearGradient>
  </defs>

  <rect width="512" height="512" rx="116" fill="url(#bg)"/>
  <circle cx="256" cy="250" r="176" fill="#FFFCFF" opacity=".14"/>

  <path d="M226 202C202 190 184 156 184 120c0-30 14-48 34-44 22 4 32 36 28 74-3 26-8 44-20 52Z" fill="#FFFCFF" stroke="#504465" stroke-width="14" stroke-linejoin="round"/>
  <path d="M220 184c-15-14-24-38-24-62 0-20 8-32 20-30 13 3 18 24 15 52-2 18-6 33-11 40Z" fill="#F7DCE8"/>

  <path d="M294 202c-8-38 2-76 24-98 16-16 38-16 50 0 12 16 28 26 46 32 22 8 26 32 10 46-16 14-38 10-52-4-12-12-20-24-24-34-6 22-18 44-34 60Z" fill="#FFFCFF" stroke="#504465" stroke-width="14" stroke-linejoin="round"/>
  <path d="M310 188c-6-28 2-54 18-70 10-10 24-10 32 0 12 14 30 24 46 30 12 4 14 16 6 22-8 6-20 4-30-6-12-12-20-24-24-34-6 20-18 40-32 54Z" fill="#F7DCE8"/>

  <path d="M143 344c-33 0-57-26-57-58 0-28 17-52 44-60 4-36 32-64 68-70 10-28 34-44 60-44 28 0 53 18 62 46 34 6 60 34 62 68 27 7 44 32 44 60 0 32-24 58-57 58H143Z" fill="url(#cloud)" stroke="#504465" stroke-width="14" stroke-linejoin="round"/>

  <ellipse cx="219" cy="264" rx="14" ry="19" fill="#504465"/>
  <circle cx="224" cy="258" r="5" fill="#FFFCFF"/>
  <path d="M282 270q16-20 32 0" fill="none" stroke="#504465" stroke-width="10" stroke-linecap="round"/>
  <ellipse cx="190" cy="300" rx="21" ry="12" fill="#F7DCE8" opacity=".95"/>
  <ellipse cx="326" cy="300" rx="21" ry="12" fill="#F7DCE8" opacity=".95"/>
  <path d="M238 292c4 14 32 14 36 0Z" fill="#504465" stroke="#504465" stroke-width="5" stroke-linejoin="round"/>
  <path d="M250 299c2 10 10 10 12 0Z" fill="#F7A8BC"/>

  <path d="m112 132 6 20 20 6-20 6-6 20-6-20-20-6 20-6 6-20Z" fill="#FFF0D8" stroke="#504465" stroke-width="7" stroke-linejoin="round"/>

  <g transform="rotate(-4 269 390)">
    <path d="M148 356h78l18-22h140c14 0 24 10 24 24v58c0 14-10 24-24 24H172c-14 0-24-10-24-24Z" fill="url(#folder)" stroke="#504465" stroke-width="14" stroke-linejoin="round"/>
    <rect x="226" y="386" width="68" height="16" rx="8" fill="#FFF0D8" stroke="#504465" stroke-width="5"/>
  </g>
</svg>`;
}

function maskableSvg(size = 512) {
  const base = brandSvg(size);
  const rectStart = base.indexOf('  <rect width="512"');
  const rectEnd = base.indexOf("/>", rectStart) + 2;
  const contentEnd = base.lastIndexOf("</svg>");
  const background = base.slice(rectStart, rectEnd).replace(' rx="116"', "");
  const artwork = base.slice(rectEnd, contentEnd);
  return `${base.slice(0, rectStart)}${background}
  <g transform="translate(51.2 51.2) scale(0.8)">${artwork}</g>
</svg>`;
}

async function writeFavicon(svg) {
  const sizes = [16, 32, 48];
  const pngs = await Promise.all(
    sizes.map((size) => sharp(svg).resize(size, size).png().toBuffer())
  );
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(sizes.length, 4);

  const entries = Buffer.alloc(16 * sizes.length);
  let offset = header.length + entries.length;
  pngs.forEach((png, index) => {
    const entry = index * 16;
    entries.writeUInt8(sizes[index], entry);
    entries.writeUInt8(sizes[index], entry + 1);
    entries.writeUInt8(0, entry + 2);
    entries.writeUInt8(0, entry + 3);
    entries.writeUInt16LE(1, entry + 4);
    entries.writeUInt16LE(32, entry + 6);
    entries.writeUInt32LE(png.length, entry + 8);
    entries.writeUInt32LE(offset, entry + 12);
    offset += png.length;
  });

  await writeFile(
    path.join(ROOT, "public", "favicon.ico"),
    Buffer.concat([header, entries, ...pngs])
  );
}

async function main() {
  await mkdir(path.join(OUT, "expressions"), { recursive: true });
  await mkdir(path.join(OUT, "poses"), { recursive: true });
  await mkdir(path.join(OUT, "states"), { recursive: true });
  await mkdir(path.join(ROOT, "public", "icons"), { recursive: true });

  for (const name of EXPRESSIONS) {
    const buffer = await prepareMascot(path.join(SRC, `${name}.png`));
    await writeFile(path.join(OUT, "expressions", `${name}.png`), buffer);
    const meta = await sharp(buffer).metadata();
    console.log("mascot:", name, `${meta.width}x${meta.height}`, "alpha:", meta.hasAlpha);
  }

  for (const [alias, source] of Object.entries(EXPRESSION_ALIASES)) {
    await copyFile(
      path.join(OUT, "expressions", `${source}.png`),
      path.join(OUT, "expressions", `${alias}.png`)
    );
  }
  for (const [alias, source] of Object.entries(STATE_ALIASES)) {
    await copyFile(
      path.join(OUT, "expressions", `${source}.png`),
      path.join(OUT, "states", `${alias}.png`)
    );
  }
  for (const [alias, source] of Object.entries(POSE_ALIASES)) {
    await copyFile(
      path.join(OUT, "expressions", `${source}.png`),
      path.join(OUT, "poses", `${alias}.png`)
    );
  }

  const svg = Buffer.from(brandSvg(512));
  await mkdir(path.join(ROOT, "public", "branding"), { recursive: true });
  await writeFile(path.join(ROOT, "public", "branding", "luminest-icon.svg"), svg);

  for (const size of [192, 512, 32]) {
    await sharp(svg)
      .resize(size, size)
      .png()
      .toFile(path.join(ROOT, "public", "icons", `icon-${size}.png`));
  }

  const maskable = Buffer.from(maskableSvg(512));
  await sharp(maskable)
    .resize(512, 512)
    .png()
    .toFile(path.join(ROOT, "public", "icons", "icon-maskable-512.png"));
  await sharp(maskable)
    .resize(180, 180)
    .png()
    .toFile(path.join(ROOT, "public", "icons", "icon-180.png"));

  await copyFile(
    path.join(ROOT, "public", "icons", "icon-192.png"),
    path.join(ROOT, "public", "icon-192.png")
  );
  await copyFile(
    path.join(ROOT, "public", "icons", "icon-512.png"),
    path.join(ROOT, "public", "icon-512.png")
  );
  await copyFile(
    path.join(ROOT, "public", "icons", "icon-180.png"),
    path.join(ROOT, "public", "apple-touch-icon.png")
  );
  await writeFavicon(svg);
  console.log("icons + branding + favicon done");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
