// Generates warm placeholder images so the catalog looks designed before real
// product photos are uploaded. Run: node scripts/make-placeholders.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "placeholders");
mkdirSync(outDir, { recursive: true });

const palettes = [
  { bg: "#F3E7D8", deep: "#DFC7A8", wax: "#FAF3E9", accent: "#C4763A" },
  { bg: "#EFE6DC", deep: "#D6C3B0", wax: "#F7EFE6", accent: "#A9603A" },
  { bg: "#F1E9E2", deep: "#DCCBBE", wax: "#FBF6F0", accent: "#B0704A" },
  { bg: "#EDE6D9", deep: "#D3C6AC", wax: "#F9F4EA", accent: "#96703C" },
  { bg: "#F4EAE4", deep: "#E0CAC0", wax: "#FCF5F1", accent: "#B2604F" },
  { bg: "#E9E5DD", deep: "#CFC8BA", wax: "#F8F5EF", accent: "#8B7B5E" },
];

function candle(p, variant) {
  const tall = variant % 3 === 0;
  const wide = variant % 3 === 2;
  const w = wide ? 300 : 200;
  const h = tall ? 460 : wide ? 260 : 340;
  const x = 600 - w / 2;
  const y = 760 - h;
  const r = wide ? 26 : 14;
  return `
    <ellipse cx="600" cy="770" rx="${w * 0.85}" ry="26" fill="${p.deep}" opacity="0.55"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="url(#wax)"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="url(#sheen)"/>
    <ellipse cx="600" cy="${y}" rx="${w / 2}" ry="${w / 9}" fill="${p.wax}"/>
    <ellipse cx="600" cy="${y}" rx="${w / 2.4}" ry="${w / 12}" fill="${p.deep}" opacity="0.35"/>
    <rect x="598" y="${y - 26}" width="4" height="26" rx="2" fill="#3A2F26"/>
    <g opacity="0.95">
      <ellipse cx="600" cy="${y - 46}" rx="34" ry="52" fill="${p.accent}" opacity="0.16"/>
      <path d="M600 ${y - 78} C 614 ${y - 60}, 616 ${y - 44}, 600 ${y - 30}
               C 584 ${y - 44}, 586 ${y - 60}, 600 ${y - 78} Z" fill="#F0A martin"/>
    </g>`;
}

const files = [];
for (let i = 0; i < 18; i++) {
  const p = palettes[i % palettes.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" width="1200" height="900">
  <defs>
    <radialGradient id="bg" cx="50%" cy="38%" r="78%">
      <stop offset="0%" stop-color="${p.bg}"/>
      <stop offset="100%" stop-color="${p.deep}"/>
    </radialGradient>
    <linearGradient id="wax" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${p.deep}"/>
      <stop offset="22%" stop-color="${p.wax}"/>
      <stop offset="70%" stop-color="${p.wax}"/>
      <stop offset="100%" stop-color="${p.deep}"/>
    </linearGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.06"/>
    </linearGradient>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
  </defs>
  <rect width="1200" height="900" fill="url(#bg)"/>
  ${candle(p, i)}
  <rect width="1200" height="900" filter="url(#grain)" opacity="0.05"/>
</svg>`;
  const name = `candle-${String(i + 1).padStart(2, "0")}.svg`;
  writeFileSync(join(outDir, name), svg.replace('fill="#F0A martin"', `fill="${p.accent}"`));
  files.push(name);
}

// Size-chart style placeholder
const chart = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="1200" height="800">
  <rect width="1200" height="800" fill="#FBF8F3"/>
  <g stroke="#CFC4B4" stroke-width="1.5" fill="none">
    <rect x="470" y="220" width="260" height="380" rx="18"/>
    <path d="M380 220 L380 600" stroke-dasharray="6 8"/>
    <path d="M470 660 L730 660" stroke-dasharray="6 8"/>
    <path d="M380 220 L440 220 M380 600 L440 600"/>
    <path d="M470 660 L470 620 M730 660 L730 620"/>
  </g>
  <g fill="#8A7C6B" font-family="Helvetica, Arial, sans-serif" font-size="26">
    <text x="300" y="418">Height</text>
    <text x="556" y="712">Diameter</text>
  </g>
  <text x="600" y="120" text-anchor="middle" fill="#3A312A" font-family="Georgia, serif" font-size="40">Size Guide</text>
  <text x="600" y="164" text-anchor="middle" fill="#8A7C6B" font-family="Helvetica, Arial, sans-serif" font-size="20">Replace with your own measured drawing</text>
</svg>`;
writeFileSync(join(outDir, "size-chart.svg"), chart);

console.log(`Wrote ${files.length + 1} placeholders to public/placeholders`);
