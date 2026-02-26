async function loadPosts(){
  const res = await fetch('data/posts.json', {cache:'no-store'});
  return await res.json();
}

function basePath(){
  const p = window.location.pathname || '/';
  if(p.endsWith('/')) return p;
  const i = p.lastIndexOf('/');
  return i>=0 ? p.substring(0, i+1) : '/';
}
function postUrl(id){
  return `${window.location.origin}${basePath()}article.html?id=${encodeURIComponent(id)}`;
}

function setArticleMeta(post){
  const url = window.location.href.split('#')[0];
  document.title = `${post.title} • Ailaai.vn`;

  const metaDesc = document.getElementById('meta-desc');
  if(metaDesc) metaDesc.setAttribute('content', post.excerpt || '');

  const canonical = document.getElementById('canonical');
  if(canonical) canonical.setAttribute('href', url);

  const ogt = document.getElementById('og-title');
  if(ogt) ogt.setAttribute('content', post.title);
  const ogd = document.getElementById('og-desc');
  if(ogd) ogd.setAttribute('content', post.excerpt || '');
  const ogu = document.getElementById('og-url');
  if(ogu) ogu.setAttribute('content', url);
  const ogi = document.getElementById('og-img');
  if(ogi){
    const img = post.image ? (post.image.startsWith('http') ? post.image : `${window.location.origin}${basePath()}${post.image.replace(/^\/?/,'')}`) : '';
    if(img) ogi.setAttribute('content', img);
  }

  const ld = {
    "@context":"https://schema.org",
    "@type":"NewsArticle",
    "headline": post.title,
    "description": post.excerpt || "",
    "datePublished": post.date,
    "dateModified": post.date,
    "author": [{"@type":"Organization","name": post.author || "Ailaai Team"}],
    "publisher": {"@type":"Organization","name":"Ailaai.vn"},
    "mainEntityOfPage": url
  };
  if(post.image){
    const img = post.image.startsWith('http') ? post.image : `${window.location.origin}${basePath()}${post.image.replace(/^\/?/,'')}`;
    ld.image = [img];
  }
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(ld);
  document.head.appendChild(script);
}

function fbParse(){
  if (window.FB && FB.XFBML) FB.XFBML.parse();
}

function slugify(s){
  return String(s||"").toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");
}
function tagHref(tag){
  return `t/${slugify(tag)}.html`;
}


function fmtDate(iso){
  try{
    return new Date(iso).toLocaleDateString('vi-VN', {year:'numeric', month:'2-digit', day:'2-digit'});
  }catch(e){ return iso; }
}
function setBg(el, url){
  if(!url) return;
  el.style.backgroundImage = `url("${url}")`;
  el.style.backgroundSize = 'cover';
  el.style.backgroundPosition = 'center';
}
function qs(sel){ return document.querySelector(sel); }
function byId(id){ return document.getElementById(id); }

function sortNewest(posts){
  return posts.slice().sort((a,b)=> new Date(b.date) - new Date(a.date));
}
function topTags(posts, limit=14){
  const m = new Map();
  posts.forEach(p => (p.tags||[]).forEach(t => m.set(t, (m.get(t)||0)+1)));
  return [...m.entries()].sort((a,b)=>b[1]-a[1]).slice(0,limit).map(x=>x[0]);
}

function buildItem(p){
  const div = document.createElement('div');
  div.className = 'item';
  div.innerHTML = `
    <div class="pic" aria-hidden="true"></div>
    <div>
      <div class="meta">${fmtDate(p.date)} • <span class="badge ${p.category==='Prompt hay'?'purple':''}">${p.category}</span> • ${p.readingTime} • <span class="fb-comments-count" data-href="${postUrl(p.id)}">0</span> bình luận</div>
      <h3><a href="article.html?id=${encodeURIComponent(p.id)}">${p.title}</a></h3>
      <p>${p.excerpt}</p>
    </div>
  `;
  setBg(div.querySelector('.pic'), p.image);
  return div;
}

function buildMini(p){
  const div = document.createElement('div');
  div.className = 'mini';
  div.innerHTML = `
    <div class="pic" aria-hidden="true"></div>
    <div>
      <div class="meta">${fmtDate(p.date)} • ${p.readingTime} • <span class="fb-comments-count" data-href="${postUrl(p.id)}">0</span></div>
      <h3><a href="article.html?id=${encodeURIComponent(p.id)}">${p.title}</a></h3>
      <p>${p.excerpt}</p>
    </div>
  `;
  setBg(div.querySelector('.pic'), p.image);
  return div;
}

function applyNavLinks(){
  document.querySelectorAll('[data-cat]').forEach(a=>{
    const cat = a.getAttribute('data-cat');
    a.href = `category.html?cat=${encodeURIComponent(cat)}`;
  });
}

async function renderHome(){
  const posts = sortNewest(await loadPosts());
  applyNavLinks();

  const featured = posts.find(p=>p.featured) || posts[0];
  const right = posts.filter(p=>p.id!==featured.id).slice(0,3);

  byId('hero-title').textContent = featured.title;
  byId('hero-excerpt').textContent = featured.excerpt;
  byId('hero-meta').textContent = `${fmtDate(featured.date)} • ${featured.category} • ${featured.readingTime}`;
  byId('hero-link').href = `article.html?id=${encodeURIComponent(featured.id)}`;
  setBg(byId('hero-thumb'), featured.image);

  const stack = byId('hero-right');
  stack.innerHTML = '';
  right.forEach(p=> stack.appendChild(buildMini(p)));

  const hot = posts.slice().sort((a,b)=> (b.views||0)-(a.views||0)).slice(0,4);
  const hotGrid = byId('hot-grid');
  hotGrid.innerHTML = '';
  hot.forEach(p=>{
    const c = document.createElement('div');
    c.className = 'card';
    c.innerHTML = `
      <div class="pad">
        <div class="meta"><span class="badge ${p.category==='Prompt hay'?'purple':''}">${p.category}</span> • ${p.readingTime}</div>
        <div class="title"><a href="article.html?id=${encodeURIComponent(p.id)}">${p.title}</a></div>
        <div class="excerpt">${p.excerpt}</div>
      </div>
    `;
    hotGrid.appendChild(c);
  });

  const gallery = byId('gallery-grid');
  if(gallery){
    gallery.innerHTML='';
    posts.slice(0,8).forEach(p=>{
      const c = document.createElement('div');
      c.className='card';
      c.innerHTML = `
        <div class="thumb" style="height:160px" aria-hidden="true"></div>
        <div class="pad">
          <div class="meta">${fmtDate(p.date)} • ${p.readingTime}</div>
          <div class="title" style="font-size:15px"><a href="article.html?id=${encodeURIComponent(p.id)}">${p.title}</a></div>
          ${p.tags && p.tags.length ? `<div class="tags-inline">${p.tags.slice(0,3).map(t=>`<a class=\"tag-chip\" href=\"${tagHref(t)}\">#${t}</a>`).join('')}</div>` : ''}
        </div>
        ${p.tags && p.tags.length ? `<div class="tags-inline">${p.tags.slice(0,2).map(t=>`<a class=\"tag-chip\" href=\"${tagHref(t)}\">#${t}</a>`).join('')}</div>` : ''}
      `;
      setBg(c.querySelector('.thumb'), p.image);
      gallery.appendChild(c);
    });
  }

  const latest = byId('latest-list');
  latest.innerHTML = '';
  posts.slice(0,10).forEach(p=> latest.appendChild(buildItem(p)));

  const trending = byId('trending');
  trending.innerHTML = '';
  hot.slice(0,5).forEach((p,i)=>{
    const row = document.createElement('div');
    row.innerHTML = `
      <div class="meta">${fmtDate(p.date)} • ${p.readingTime} • <span class="fb-comments-count" data-href="${postUrl(p.id)}">0</span></div>
      <div style="font-weight:900; margin-top:3px"><a href="article.html?id=${encodeURIComponent(p.id)}">${p.title}</a></div>
    `;
    if(i>0) row.style.borderTop = '1px solid var(--line)';
    row.style.padding = '10px 0';
    trending.appendChild(row);
  });

  const promptSpot = posts.filter(p=>p.category==='Prompt hay').slice(0,3);
  const toolSpot = posts.filter(p=>p.category==='Tool AI').slice(0,3);

  const ps = byId('prompt-spot'); ps.innerHTML='';
  promptSpot.forEach(p=> ps.appendChild(buildMini(p)));

  const ts = byId('tool-spot'); ts.innerHTML='';
  toolSpot.forEach(p=> ts.appendChild(buildMini(p)));

  const tags = topTags(posts, 16);
  const cloud = byId('tagcloud');
  cloud.innerHTML='';
  tags.forEach(t=>{
    const a = document.createElement('a');
    a.className = 'tag';
    a.href = `category.html?tag=${encodeURIComponent(t)}`;
    a.textContent = `#${t}`;
    cloud.appendChild(a);
  });

  // Tag chips dưới bài
  const tagWrap = document.getElementById('a-tags');
  if(tagWrap){
    tagWrap.innerHTML = '';
    (post.tags||[]).forEach(t=>{
      const a = document.createElement('a');
      a.className = 'tag-chip';
      a.href = tagHref(t);
      a.textContent = '#' + t;
      tagWrap.appendChild(a);
    });
  }

  // Liên quan theo tag (ưu tiên trùng nhiều tag)
  const relTags = document.getElementById('related-tags');
  if(relTags){
    const tags = (post.tags||[]).map(t=>String(t).toLowerCase());
    const scored = relatedAll
      .filter(p=>p.id!==post.id && (p.tags||[]).length)
      .map(p=>{
        const pt = (p.tags||[]).map(t=>String(t).toLowerCase());
        const overlap = pt.filter(x=>tags.includes(x)).length;
        return {p, overlap};
      })
      .filter(x=>x.overlap>0)
      .sort((a,b)=> b.overlap-a.overlap || String(b.p.date).localeCompare(String(a.p.date)))
      .slice(0,6)
      .map(x=>x.p);

    relTags.innerHTML = '';
    scored.forEach(p=> relTags.appendChild(buildItem(p)));
  }

  fbParse();

  const input = qs('[data-search]');
  if(input){
    input.addEventListener('input', ()=>{
      const q = input.value.trim().toLowerCase();
      const filtered = !q ? posts : posts.filter(p=>{
        const hay = `${p.title} ${p.excerpt} ${p.category} ${(p.tags||[]).join(' ')}`.toLowerCase();
        return hay.includes(q);
      });
      latest.innerHTML='';
      filtered.slice(0,12).forEach(p=> latest.appendChild(buildItem(p)));
    });
  }
}

async function renderArticle(){
  applyNavLinks();
  const posts = await loadPosts();
  const id = new URLSearchParams(location.search).get('id');
  const post = posts.find(p=>p.id===id) || posts[0];

  setArticleMeta(post);
  byId('a-title').textContent = post.title;
  byId('a-lead').textContent = post.excerpt;
  byId('a-meta').textContent = `${fmtDate(post.date)} • ${post.category} • ${post.readingTime} • ${post.author}`;
  setBg(byId('a-thumb'), post.image);
  byId('a-content').innerHTML = post.contentHtml;

  const related = posts.filter(p=>p.category===post.category && p.id!==post.id).slice(0,6);
  const rel = byId('related');
  rel.innerHTML='';
  related.forEach(p=> rel.appendChild(buildItem(p)));

  // Share + comment count
  const url = window.location.href.split('#')[0];
  const share = document.getElementById('btn-fbshare');
  if(share) share.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  const cc = document.getElementById('a-commentcount');
  if(cc) cc.innerHTML = `<span class=\"fb-comments-count\" data-href=\"${url}\">0</span> bình luận`;
  const copyBtn = document.getElementById('btn-copylink');
  if(copyBtn){
    copyBtn.addEventListener('click', async ()=>{
      try{ await navigator.clipboard.writeText(url); copyBtn.textContent='Đã copy!'; setTimeout(()=>copyBtn.textContent='Copy link',1200);}catch(e){ alert('Copy không được, bạn copy thủ công: '+url); }
    });
  }
  fbParse();
}

async function renderCategory(){
  applyNavLinks();
  const posts = sortNewest(await loadPosts());
  const params = new URLSearchParams(location.search);
  const cat = params.get('cat');
  const tag = params.get('tag');

  let title = 'Khám phá';
  let filtered = posts;
  if(cat){
    title = `Chuyên mục: ${cat}`;
    filtered = posts.filter(p=>p.category===cat);
  }
  if(tag){
    title = `Tag: #${tag}`;
    filtered = posts.filter(p=> (p.tags||[]).includes(tag));
  }
  byId('c-title').textContent = title;
  byId('c-sub').textContent = `Có ${filtered.length} bài phù hợp.`;

  const list = byId('c-list');
  list.innerHTML='';
  filtered.forEach(p=> list.appendChild(buildItem(p)));
  fbParse();
}

document.addEventListener('DOMContentLoaded', ()=>{
  const page = document.body.dataset.page;
  if(page==='home') renderHomePro();
  if(page==='article') renderArticle();
  if(page==='category') renderCategory();
  if(page==='tools') renderTools();
  if(page==='tag') renderTagPage();
  if(page==='search') renderSearchPage();
  if(page==='author') renderAuthorPage();
  if(page==='home') renderHomePro();
});


async function loadTools(){
  const res = await fetch('data/tools.json', {cache:'no-store'});
  return await res.json();
}
function starRow(rating, reviews){
  return `<span class="star">★★★★★</span> <strong>${Number(rating).toFixed(1)}</strong> <span style="color:var(--muted)">(${reviews})</span>`;
}
function buildToolCard(t){
  const div = document.createElement('div');
  div.className = 'toolcard';
  div.innerHTML = `
    <div class="tooltop">
      <div class="toolicon"><img alt="" src="${t.icon}"/></div>
      <div style="min-width:0">
        <div class="toolname">${t.name}</div>
        <div class="toolsub">${t.category} • ${t.price}</div>
      </div>
    </div>
    <div style="color:var(--muted);font-size:13px">${t.desc}</div>
    <div class="toolmeta">
      <div>${starRow(t.rating, t.reviews)}</div>
      <span class="badge2">${t.badge}</span>
    </div>
    <div class="toolactions">
      <a class="btnlink" href="${t.link}" target="_blank" rel="noopener">Mở công cụ →</a>
      <a class="tag" href="category.html?tag=${encodeURIComponent(t.category)}">#${t.category}</a>
    </div>
  `;
  return div;
}
async function renderTools(){
  try{ applyNavLinks(); }catch(e){}
  const tools = await loadTools();
  const qInput = document.querySelector('[data-toolsearch]');
  const cSelect = document.querySelector('[data-toolcat]');
  const grid = document.getElementById('tools-grid');

  const cats = Array.from(new Set(tools.map(t=>t.category))).sort();
  if(cSelect){
    cSelect.innerHTML = `<option value="">Tất cả nhóm</option>` + cats.map(c=>`<option value="${c}">${c}</option>`).join('');
  }
  function paint(){
    const q = (qInput?.value || '').trim().toLowerCase();
    const cat = (cSelect?.value || '');
    const filtered = tools.filter(t=>{
      const hay = `${t.name} ${t.desc} ${t.category} ${t.price} ${t.badge}`.toLowerCase();
      const okQ = !q || hay.includes(q);
      const okC = !cat || t.category===cat;
      return okQ && okC;
    });
    grid.innerHTML = '';
    filtered.forEach(t=> grid.appendChild(buildToolCard(t)));
    const count = document.getElementById('tools-count');
    if(count) count.textContent = `${filtered.length} công cụ`;
  }
  qInput?.addEventListener('input', paint);
  cSelect?.addEventListener('change', paint);
  paint();
}


function renderTagPage(){
  const main = document.querySelector('main[data-tag]');
  const tag = main?.getAttribute('data-tag') || new URLSearchParams(location.search).get('tag') || '';
  const title = document.getElementById('tag-title');
  if(title) title.textContent = '#' + tag;

  const list = document.getElementById('tag-list');
  if(!list) return;

  loadPosts().then(posts=>{
    const relatedAll = posts;

    const filtered = posts.filter(p => (p.tags||[]).map(t=>String(t).toLowerCase()).includes(String(tag).toLowerCase()));
    list.innerHTML = '';
    filtered.forEach(p=> list.appendChild(buildItem(p)));
    fbParse();
  });
}


function wireGlobalSearch(){
  const inputs = document.querySelectorAll('input[data-search]');
  inputs.forEach(inp=>{
    inp.addEventListener('keydown', (e)=>{
      if(e.key==='Enter'){
        const q = String(inp.value||'').trim();
        if(!q) return;
        window.location.href = `search.html?q=${encodeURIComponent(q)}`;
      }
    });
  });
}


function renderSearchPage(){
  const input = document.getElementById('search-q');
  const meta = document.getElementById('search-meta');
  const list = document.getElementById('search-list');
  const q0 = (qs('q') || '').trim();

  if(input){
    input.value = q0;
    input.addEventListener('input', ()=> run(input.value));
  }
  function score(p, q){
    const s = q.toLowerCase();
    const hay = [
      p.title||'',
      p.excerpt||'',
      p.category||'',
      (p.tags||[]).join(' '),
      (p.contentHtml||'').replace(/<[^>]+>/g,' ')
    ].join(' ').toLowerCase();
    if(!s) return 0;
    // simple scoring: title/excerpt heavier
    let sc = 0;
    if((p.title||'').toLowerCase().includes(s)) sc += 5;
    if((p.excerpt||'').toLowerCase().includes(s)) sc += 3;
    if((p.category||'').toLowerCase().includes(s)) sc += 2;
    if((p.tags||[]).join(' ').toLowerCase().includes(s)) sc += 2;
    if(hay.includes(s)) sc += 1;
    return sc;
  }

  function run(q){
    const qn = String(q||'').trim();
    if(meta) meta.textContent = qn ? `Kết quả cho: “${qn}”` : 'Nhập từ khoá để tìm bài viết.';
    if(!list) return;

    loadPosts().then(posts=>{
      const items = qn ? posts
        .map(p=>({p, sc: score(p, qn)}))
        .filter(x=>x.sc>0)
        .sort((a,b)=> b.sc-a.sc || String(b.p.date).localeCompare(String(a.p.date)))
        .slice(0, 18)
        .map(x=>x.p) : [];

      list.innerHTML = '';
      items.forEach(p=> list.appendChild(buildItem(p)));
      fbParse();
    });
  }

  run(q0);
}


function renderHomePro(){
  const hero = document.getElementById('home-hero');
  const trending = document.getElementById('home-trending');
  const latest = document.getElementById('home-latest');

  loadPosts().then(posts=>{
    const sorted = [...posts].sort((a,b)=> String(b.date).localeCompare(String(a.date)));
    const featured = sorted.filter(p=>p.featured).slice(0,1)[0] || sorted[0];
    const side = sorted.filter(p=>p.id!==featured.id).slice(0,3);

    if(hero && featured){
      hero.innerHTML = `
        <div class="hero-main">
          <span class="kicker">★ Nổi bật</span>
          <h1>${featured.title}</h1>
          <p>${featured.excerpt || ''}</p>
          <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
            <a class="cta" href="article.html?id=${encodeURIComponent(featured.id)}">Đọc ngay</a>
            <span style="color:var(--muted);font-size:13px">${featured.category || ''} • ${featured.readingTime || ''}</span>
          </div>
        </div>
        <div class="hero-side">
          ${side.map(p=>`
            <a class="card" style="text-decoration:none;color:var(--text)" href="article.html?id=${encodeURIComponent(p.id)}">
              <div style="font-weight:800;line-height:1.25">${p.title}</div>
              <div style="margin-top:6px;color:var(--muted);font-size:13px">${p.category || ''} • ${p.readingTime || ''}</div>
            </a>
          `).join('')}
        </div>
      `;
    }

    // trending: featured + newest mix
    const trendList = sorted.filter(p=>p.id!==featured?.id).slice(0,9);
    if(trending){
      trending.innerHTML = '';
      trendList.forEach(p=> trending.appendChild(buildItem(p)));
    }

    if(latest){
      latest.innerHTML = '';
      sorted.slice(0,12).forEach(p=> latest.appendChild(buildItem(p)));
    }

    fbParse();
  });
}


function renderAuthorPage(){
  const main = document.querySelector('main[data-author]');
  const author = main?.getAttribute('data-author') || qs('author') || '';
  const title = document.getElementById('author-title');
  if(title) title.textContent = author || 'Tác giả';

  const list = document.getElementById('author-list');
  if(!list) return;

  loadPosts().then(posts=>{
    const filtered = posts
      .filter(p=> String(p.author||'').toLowerCase() === String(author||'').toLowerCase())
      .sort((a,b)=> String(b.date).localeCompare(String(a.date)));
    list.innerHTML = '';
    filtered.forEach(p=> list.appendChild(buildItem(p)));
    fbParse();
  });
}
