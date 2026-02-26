import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "assets", "og");
fs.mkdirSync(OUT_DIR, { recursive: true });

/**
 * Sharp parses SVG via libxml2 -> it WILL crash on undefined HTML entities (e.g. &nbsp;)
 * or unescaped &, <, >, quotes. Always escape XML text nodes.
 */
function escapeXml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Avoid any remaining named entities that might slip in from external text.
// Convert a few common HTML entities to safe unicode / numeric.
function sanitizeText(str = "") {
  return String(str)
    .replace(/&nbsp;/gi, " ")
    .replace(/&ndash;/gi, "–")
    .replace(/&mdash;/gi, "—")
    .replace(/&hellip;/gi, "…")
    .replace(/&rsquo;/gi, "’")
    .replace(/&lsquo;/gi, "‘")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&amp;/gi, "&"); // normalize, will be escaped later
}

function wrapLines(text, max = 42) {
  const words = sanitizeText(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const w of words) {
    const t = line ? line + " " + w : w;
    if (t.length <= max) line = t;
    else {
      if (line) lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

async function safeWritePngFromSvg(svg, outPath) {
  try {
    // density helps crisp text
    await sharp(Buffer.from(svg, "utf8"), { density: 220 })
      .png({ quality: 90 })
      .toFile(outPath);
    return true;
  } catch (err) {
    console.error("[OG] Sharp failed:", outPath);
    console.error("[OG] Reason:", err?.message || err);
    return false;
  }
}

function ensureDefaultOgExists() {
  const def = path.join(OUT_DIR, "default.png");
  if (!fs.existsSync(def)) {
    // Create a very simple fallback image so build never fails.
    const svg = `
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#2563eb"/>
      <stop offset="55%" stop-color="#22c55e"/>
      <stop offset="100%" stop-color="#0ea5e9"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <text x="90" y="120" font-size="52" font-weight="800" fill="rgba(255,255,255,0.95)">ailaai.vn</text>
  <text x="90" y="180" font-size="28" font-weight="600" fill="rgba(255,255,255,0.92)">Trang tin tức &amp; công cụ AI cho người Việt</text>
</svg>`;
    // best effort; if this fails something is very wrong
    return safeWritePngFromSvg(svg, def);
  }
  return true;
}

export async function buildOgForPosts(posts) {
  ensureDefaultOgExists();
  const fallback = path.join(OUT_DIR, "default.png");

  for (const p of posts) {
    const cat = escapeXml(sanitizeText(p.category || "Tin AI").toUpperCase());
    const lines = wrapLines(p.title || "", 40).map((ln) => escapeXml(ln));
    const lineSvg = lines
      .map((ln, i) => {
        const y = 330 + i * 72;
        return `<text x="90" y="${y}" font-size="56" font-weight="800" fill="#0f172a">${ln}</text>`;
      })
      .join("\n");

    const svg = `
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#2563eb"/>
      <stop offset="55%" stop-color="#22c55e"/>
      <stop offset="100%" stop-color="#0ea5e9"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="14" stdDeviation="16" flood-color="#000" flood-opacity="0.22"/>
    </filter>
  </defs>

  <rect width="1200" height="630" fill="url(#g)"/>
  <circle cx="180" cy="120" r="220" fill="rgba(255,255,255,0.18)"/>
  <circle cx="1030" cy="520" r="320" fill="rgba(255,255,255,0.14)"/>

  <text x="90" y="90" font-size="28" font-weight="700" fill="rgba(255,255,255,0.95)">ailaai.vn</text>
  <text x="90" y="126" font-size="22" font-weight="600" fill="rgba(255,255,255,0.9)">AI tin tức • công cụ • thực chiến</text>

  <rect x="70" y="200" width="1060" height="360" rx="26" fill="rgba(255,255,255,0.9)" filter="url(#shadow)"/>
  <rect x="90" y="228" width="220" height="44" rx="22" fill="rgba(15,23,42,0.08)"/>
  <text x="110" y="259" font-size="20" font-weight="800" fill="#0f172a">${cat}</text>

  ${lineSvg}

  <text x="90" y="560" font-size="20" font-weight="600" fill="rgba(15,23,42,0.65)">Ailaai.vn — Trang tin tức &amp; công cụ AI cho người Việt</text>
</svg>`;

    const out = path.join(OUT_DIR, `${p.id}.png`);
    const ok = await safeWritePngFromSvg(svg, out);

    if (!ok) {
      // Always keep build green: copy default as fallback
      try {
        fs.copyFileSync(fallback, out);
      } catch (e) {
        // last resort: ignore
      }
    }

    p.ogImage = `/assets/og/${p.id}.png`;
  }

  // Keep default.png available (already ensured)
  return posts;
}
