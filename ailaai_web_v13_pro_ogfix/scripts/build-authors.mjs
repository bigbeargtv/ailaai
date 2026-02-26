import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const posts = JSON.parse(fs.readFileSync(path.join(ROOT,"data","posts.json"),"utf8"));

function slugify(s){
  return String(s||"").toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");
}
function esc(s){ return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

const map = new Map();
for(const p of posts){
  const a = String(p.author||"Ailaai Team").trim();
  map.set(a, (map.get(a)||0) + 1);
}
const authors = Array.from(map.entries()).map(([name,count])=>({name,count,slug:slugify(name)})).sort((a,b)=>b.count-a.count || a.name.localeCompare(b.name));

const authorTpl = fs.readFileSync(path.join(ROOT,"author.html"),"utf8");
const authorsTpl = fs.readFileSync(path.join(ROOT,"authors.html"),"utf8");

fs.mkdirSync(path.join(ROOT,"a"), { recursive:true });

for(const a of authors){
  let html = authorTpl.replace('data-author=""', `data-author="${esc(a.name)}"`);
  html = html.replace("<title>Tác giả • Ailaai</title>", `<title>${esc(a.name)} • Tác giả • Ailaai</title>`);
  html = html.replace('rel="canonical" href="https://ailaai.vn/author.html"', `rel="canonical" href="https://ailaai.vn/a/${a.slug}.html"`);
  html = html.replace('property="og:url" content="https://ailaai.vn/author.html"', `property="og:url" content="https://ailaai.vn/a/${a.slug}.html"`);
  fs.writeFileSync(path.join(ROOT,"a",`${a.slug}.html`), html, "utf8");
}

const list = authors.map(a=>`
<a class="author-card" href="a/${a.slug}.html">
  <div class="name">${esc(a.name)}</div>
  <div class="meta"><span>${a.count} bài</span><span>•</span><span>Xem profile →</span></div>
</a>`).join("\n");

let out = authorsTpl.replace('<div class="authors-grid" id="authors-list"></div>', `<div class="authors-grid" id="authors-list">${list}</div>`);
fs.writeFileSync(path.join(ROOT,"authors.html"), out, "utf8");

console.log(`Generated ${authors.length} author pages`);
