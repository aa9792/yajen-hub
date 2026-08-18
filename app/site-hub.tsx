"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Site = {
  id: string;
  title: string;
  url: string;
  category: string;
  description: string;
  image?: string;
  color: string;
  favorite?: boolean;
};

const STORAGE_KEY = "site-hub-items-v1";

const starterSites: Site[] = [
  { id: "reeds", title: "REEDS 學習中心", url: "https://aa9792.github.io/reeds/", category: "教學資源", description: "課程規劃、教學內容與校務資訊的整合平台。", color: "#396253", favorite: true },
  { id: "curriculum", title: "課程設計工作台", url: "#", category: "工作工具", description: "整理課程地圖、學習目標與每週教學進度。", color: "#bf6948" },
  { id: "resources", title: "教師資源庫", url: "#", category: "教學資源", description: "常用教材、表單與教學素材的快速入口。", color: "#446789" },
  { id: "adventure", title: "戶外教育計畫", url: "#", category: "專案計畫", description: "梯次、師資安排與戶外課程紀錄。", color: "#a17a38" },
];

function loadSites(): Site[] {
  if (typeof window === "undefined") return starterSites;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : starterSites;
  } catch {
    return starterSites;
  }
}

function saveSites(sites: Site[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sites));
}

function Header() {
  return (
    <header className="topbar">
      <a className="brand" href="/" aria-label="回到首頁">
        <span className="brand-mark"><i /><i /><i /><i /></span>
        <span>PORTAL</span>
      </a>
      <nav aria-label="主要選單">
        <a href="/">所有網站</a>
        <a className="add-link" href="/add"><span>＋</span> 新增網站</a>
      </nav>
    </header>
  );
}

function Preview({ site }: { site: Site }) {
  if (site.image) return <img src={site.image} alt={`${site.title} 網站縮圖`} />;
  return (
    <div className="generated-preview" style={{ "--site-color": site.color } as React.CSSProperties}>
      <div className="browser-dots"><i /><i /><i /></div>
      <div className="preview-content">
        <span className="preview-badge">{site.category}</span>
        <strong>{site.title}</strong>
        <span className="preview-line wide" /><span className="preview-line" />
        <span className="preview-button">VIEW SITE</span>
      </div>
    </div>
  );
}

export function SiteHub() {
  const [sites, setSites] = useState<Site[]>(starterSites);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("全部");
  const [menu, setMenu] = useState<string | null>(null);

  useEffect(() => setSites(loadSites()), []);
  const categories = useMemo(() => ["全部", ...Array.from(new Set(sites.map((site) => site.category)))], [sites]);
  const visible = sites.filter((site) => (category === "全部" || site.category === category) && `${site.title} ${site.description}`.toLowerCase().includes(query.toLowerCase()));

  function update(next: Site[]) { setSites(next); saveSites(next); setMenu(null); }
  function toggleFavorite(id: string) { update(sites.map((site) => site.id === id ? { ...site, favorite: !site.favorite } : site)); }
  function remove(id: string) { if (confirm("確定要從入口頁移除這個網站嗎？")) update(sites.filter((site) => site.id !== id)); }

  return (
    <main>
      <Header />
      <section className="hero">
        <div>
          <p className="eyebrow">YOUR DIGITAL HOME</p>
          <h1>所有網站，<em>一目了然。</em></h1>
          <p className="hero-copy">把散落各處的網站收進同一個入口，少一點尋找，多一點專注。</p>
        </div>
        <div className="hero-stat"><strong>{String(sites.length).padStart(2, "0")}</strong><span>個網站<br />已收錄</span></div>
      </section>

      <section className="controls" aria-label="網站篩選工具">
        <div className="search"><span>⌕</span><input aria-label="搜尋網站" placeholder="搜尋網站名稱或內容..." value={query} onChange={(e) => setQuery(e.target.value)} /></div>
        <div className="categories">
          {categories.map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}
        </div>
      </section>

      <section className="gallery">
        <div className="section-title"><h2>{category === "全部" ? "網站總覽" : category}</h2><span>{visible.length} 個結果</span></div>
        {visible.length ? <div className="site-grid">
          {visible.map((site, index) => (
            <article className="site-card" key={site.id}>
              <a className="thumbnail" href={site.url} target={site.url === "#" ? undefined : "_blank"} rel="noreferrer"><Preview site={site} /><span className="open-pill">開啟 ↗</span></a>
              <div className="card-body">
                <div className="card-meta"><span className="number">{String(index + 1).padStart(2, "0")}</span><span className="category-dot" style={{ background: site.color }} /> <span>{site.category}</span></div>
                <div className="card-heading"><h3>{site.title}</h3><button aria-label={`${site.title} 更多選項`} onClick={() => setMenu(menu === site.id ? null : site.id)}>•••</button></div>
                <p>{site.description}</p>
                {site.favorite && <span className="favorite">★ 常用</span>}
                {menu === site.id && <div className="card-menu"><button onClick={() => toggleFavorite(site.id)}>{site.favorite ? "取消常用" : "設為常用"}</button><button className="danger" onClick={() => remove(site.id)}>移除網站</button></div>}
              </div>
            </article>
          ))}
          <a className="add-card" href="/add"><span>＋</span><strong>新增一個網站</strong><small>建立新的快速入口</small></a>
        </div> : <div className="empty"><strong>沒有找到符合的網站</strong><p>試著更換關鍵字或分類。</p></div>}
      </section>
      <footer><span>PORTAL · YOUR DIGITAL HOME</span><span>保持簡單，專注重要的事。</span></footer>
    </main>
  );
}

export function AddSite() {
  const colors = ["#396253", "#bf6948", "#446789", "#a17a38", "#725780"];
  const [color, setColor] = useState(colors[0]);
  const [image, setImage] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("工作工具");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const current = loadSites();
    const url = String(form.get("url") || "");
    const next: Site = { id: crypto.randomUUID(), title, url: /^https?:\/\//i.test(url) ? url : `https://${url}`, category, description: String(form.get("description") || ""), image, color };
    saveSites([next, ...current]);
    window.location.href = "/";
  }

  return (
    <main>
      <Header />
      <section className="add-layout">
        <div className="form-intro"><a href="/">← 返回網站總覽</a><p className="eyebrow">ADD A NEW SITE</p><h1>新增你的<br /><em>下一個入口。</em></h1><p>填入網站資訊，它就會出現在你的入口首頁。所有欄位之後都可以重新建立。</p></div>
        <form className="site-form" onSubmit={submit}>
          <div className="form-section"><span>01</span><h2>基本資訊</h2></div>
          <label>網站名稱<input required value={title} onChange={(e) => setTitle(e.target.value)} name="title" placeholder="例如：課程管理系統" /></label>
          <label>網站網址<input required name="url" type="text" inputMode="url" placeholder="https://example.com" /></label>
          <div className="two-col"><label>分類<input required value={category} onChange={(e) => setCategory(e.target.value)} name="category" list="category-list" placeholder="選擇或輸入分類" /><datalist id="category-list"><option>教學資源</option><option>工作工具</option><option>專案計畫</option><option>個人收藏</option></datalist></label><label>卡片色彩<span className="color-row">{colors.map((item) => <button type="button" aria-label={`選擇色彩 ${item}`} className={color === item ? "selected" : ""} style={{ background: item }} onClick={() => setColor(item)} key={item} />)}</span></label></div>
          <label>簡短說明<textarea required name="description" rows={3} placeholder="這個網站主要用來做什麼？" /></label>
          <div className="form-section second"><span>02</span><h2>網站縮圖</h2></div>
          <label>縮圖網址 <small>選填</small><input value={image} onChange={(e) => setImage(e.target.value)} name="image" type="url" placeholder="https://example.com/preview.jpg" /></label>
          <div className="live-preview"><span>卡片預覽</span><div className="mini-card"><Preview site={{ id: "preview", title: title || "你的網站名稱", url: "#", category, description: "", image, color }} /><strong>{title || "你的網站名稱"}</strong><small>{category}</small></div></div>
          <div className="form-actions"><a href="/">取消</a><button type="submit">儲存並新增網站 <span>→</span></button></div>
        </form>
      </section>
    </main>
  );
}
