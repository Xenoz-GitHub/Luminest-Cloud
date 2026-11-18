import sharp from "sharp";
import { mkdir, access } from "node:fs/promises";
import { constants } from "node:fs";

const SOURCE = "public/icons/icon-512.png";
const DENSITIES = [
  { dir: "mipmap-mdpi", size: 48 },
  { dir: "mipmap-hdpi", size: 72 },
  { dir: "mipmap-xhdpi", size: 96 },
  { dir: "mipmap-xxhdpi", size: 144 },
  { dir: "mipmap-xxxhdpi", size: 192 },
];

const base = "android/app/src/main/res";

await access(SOURCE, constants.R_OK);

for (const { dir, size } of DENSITIES) {
  const outDir = `${base}/${dir}`;
  await mkdir(outDir, { recursive: true });
  await sharp(SOURCE)
    .resize(size, size, { fit: "cover" })
    .png()
    .toFile(`${outDir}/ic_launcher.png`);
  console.log(`wrote ${outDir}/ic_launcher.png (${size}px)`);
}
