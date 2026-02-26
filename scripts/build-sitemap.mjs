import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const domain = process.env.SITE_URL || "https://ailaai.vn";

const postsPath = path.join(ROOT,"data","posts.json");
const posts = fs.existsSync(postsPath) ? JSON.parse(fs.readFileSync(postsPath,"utf8")) : [];

function esc(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

const urls = [
  `${domain}/`,
  `${domain}/index.html`,
  `${domain}/category.html`,
  `${domain}/tools.html`,
  `${domain}/tags.html`,
  `${domain}/authors.html`,
  `${domain}/search.html`,
];

const aDir = path.join(ROOT,'a');
if(fs.existsSync(aDir)){
  for(const f of fs.readdirSync(aDir)){
    if(f.endsWith('.html')) urls.push(`${domain}/a/${f}`);
  }
}

const tDir = path.join(ROOT,'t');
if(fs.existsSync(tDir)){
  for(const f of fs.readdirSync(tDir)){
    if(f.endsWith('.html')) urls.push(`${domain}/t/${f}`);
  }
}

for(const p of posts){
  urls.push(`${domain}/article.html?id=${encodeURIComponent(p.id)}`);
}

const now = new Date().toISOString();
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u=>`  <url><loc>${esc(u)}</loc><lastmod>${now}</lastmod></url>`).join("\n")}
</urlset>
`;

fs.writeFileSync(path.join(ROOT,"sitemap.xml"), xml, "utf8");
console.log(`Generated sitemap.xml with ${urls.length} URLs`);
