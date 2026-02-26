import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";
import { buildOgForPosts } from "./build-og.mjs";


async function main(){
  const ROOT = process.cwd();
  const POSTS_DIR = path.join(ROOT, "content", "posts");
  const OUT = path.join(ROOT, "data", "posts.json");

  function safeArray(v){
    if(!v) return [];
    if(Array.isArray(v)) return v.filter(Boolean).map(String);
    if(typeof v === "string") return v.split(",").map(s=>s.trim()).filter(Boolean);
    return [];
  }

  function readingTime(text){
    const words = (text || "").replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(3, Math.round(words / 200));
    return `${minutes} phút đọc`;
  }

  function listFiles(dir){
    if(!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir).filter(f=>f.endsWith(".md") || f.endsWith(".markdown")).sort().reverse();
  }

  const files = listFiles(POSTS_DIR);
  const posts = files.map((file) => {
    const full = path.join(POSTS_DIR, file);
    const raw = fs.readFileSync(full, "utf8");
    const { data, content } = matter(raw);

    const id = path.basename(file).replace(/\.(md|markdown)$/,"");
    const title = String(data.title || "Bài viết");
    const excerpt = String(data.excerpt || "");
    const date = String(data.date || new Date().toISOString().slice(0,10));
    const category = String(data.category || "Tin AI");
    const author = String(data.author || "Ailaai Team");
  const authorBio = data.author_bio ? String(data.author_bio) : "";
    const featured = Boolean(data.featured || false);
    const tags = safeArray(data.tags);
    const image = data.image ? String(data.image) : "";

    const html = marked.parse(content || "");
    const contentHtml = (image ? `<p><img src="${image}" alt="${title}" style="width:100%;height:auto;border-radius:14px;border:1px solid var(--line)"/></p>\n` : "") + html;

    return {
      id,
      title,
      excerpt,
      date,
      category,
      tags,
      author,
      readingTime: readingTime(contentHtml),
      views: 0,
      featured,
      image,
      contentHtml
    };
  });

  await buildOgForPosts(posts);

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(posts, null, 2), "utf8");
  const { execSync } = await import('node:child_process');
  execSync('node scripts/build-tags.mjs', { stdio: 'inherit' });
  execSync('node scripts/build-authors.mjs', { stdio: 'inherit' });
  execSync('node scripts/build-sitemap.mjs', { stdio: 'inherit' });
  console.log(`Generated ${posts.length} posts -> data/posts.json`);

}

main();
