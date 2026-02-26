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
  for(const t of (p.tags||[])){
    const tag = String(t).trim();
    if(!tag) continue;
    map.set(tag, (map.get(tag)||0) + 1);
  }
}
const tags = Array.from(map.entries()).map(([tag,count])=>({tag,count,slug:slugify(tag)})).sort((a,b)=>b.count-a.count || a.tag.localeCompare(b.tag));

const tagTpl = fs.readFileSync(path.join(ROOT,"tag.html"),"utf8");
const tagsTpl = fs.readFileSync(path.join(ROOT,"tags.html"),"utf8");

fs.mkdirSync(path.join(ROOT,"t"), { recursive:true });

for(const t of tags){
  let html = tagTpl.replace('data-tag=""', `data-tag="${esc(t.tag)}"`);
  html = html.replace("<title>Tag • Ailaai</title>", `<title>${esc(t.tag)} • Tag • Ailaai</title>`);
  html = html.replace('rel="canonical" href="https://ailaai.vn/tag.html"', `rel="canonical" href="https://ailaai.vn/t/${t.slug}.html"`);
  html = html.replace('property="og:url" content="https://ailaai.vn/tag.html"', `property="og:url" content="https://ailaai.vn/t/${t.slug}.html"`);
  fs.writeFileSync(path.join(ROOT,"t",`${t.slug}.html`), html, "utf8");
}

const list = tags.map(t=>`<a class="tag" href="t/${t.slug}.html">#${esc(t.tag)} <span style="opacity:.65">(${t.count})</span></a>`).join("\n");
let tagsHtml = tagsTpl.replace('<!--TAGS_LIST-->', list);
fs.writeFileSync(path.join(ROOT,"tags.html"), tagsHtml, "utf8");

console.log(`Generated ${tags.length} tag pages`);
