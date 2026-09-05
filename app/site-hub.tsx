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
const SYNC_TOKEN_KEY = "yajen-hub-sheet-token-v1";
const SHEET_API_URL = import.meta.env.VITE_SHEET_API_URL || "";

function appHref(path: "/" | "/add") {
  if (typeof window !== "undefined" && window.location.hostname.endsWith("github.io")) {
    return path === "/" ? "./#/" : "./#/add";
  }
  return path;
}
const SOFT_COLOR_MAP: Record<string, string> = {
  "#396253": "#BFE6D3",
  "#bf6948": "#F6B8D4",
  "#446789": "#A9E5F1",
  "#a17a38": "#F7D6A3",
  "#725780": "#C9C0FF",
};

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
    if (!saved) return starterSites;
    const parsed: Site[] = JSON.parse(saved);
    const softened = parsed.map((site) => ({ ...site, color: SOFT_COLOR_MAP[site.color] || site.color }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(softened));
    return softened;
  } catch {
    return starterSites;
  }
}

function saveSites(sites: Site[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sites));
}

async function loadSheetSites(): Promise<Site[]> {
  if (!SHEET_API_URL) throw new Error("Google 試算表尚未完成連線設定。");
  const response = await fetch(`${SHEET_API_URL}?action=listSites&_=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) throw new Error("無法讀取 Google 試算表。");
  const result = await response.json();
  if (!result.ok || !Array.isArray(result.sites)) throw new Error(result.error || "試算表服務尚未更新。");
  return result.sites.map((site: Partial<Site>, index: number) => ({
    id: site.id || `sheet-${index}`,
    title: site.title || "未命名網站",
    url: site.url || "#",
    category: site.category || "其他",
    description: site.description || "",
    image: site.image || "",
    color: site.color || ["#C9C0FF", "#F6B8D4", "#A9E5F1", "#BFE6D3", "#F7D6A3"][index % 5],
  }));
}

function Header() {
  return (
    <header className="topbar">
      <a className="brand" href={appHref("/")} aria-label="回到首頁">
        <span className="brand-mark"><i /><i /><i /><i /></span>
        <span className="brand-copy"><b>YAJEN HUB</b><small>雅真匯</small></span>
      </a>
      <nav aria-label="主要選單">
        <a href={appHref("/")}>所有網站</a>
        <a className="add-link" href={appHref("/add")}><span>＋</span> 新增網站</a>
      </nav>
    </header>
  );
}

function screenshotUrl(url: string, refreshKey = 0) {
  return `https://image.thum.io/get/width/1200/crop/675/noanimate/?url=${encodeURIComponent(url)}&refresh=${refreshKey}`;
}

function Preview({ site, refreshKey = 0 }: { site: Site; refreshKey?: number }) {
  const [source, setSource] = useState<string | null>(site.image || null);
  const [triedScreenshot, setTriedScreenshot] = useState(false);

  useEffect(() => {
    let active = true;
    setTriedScreenshot(false);
    if (site.image) {
      setSource(site.image);
      return () => { active = false; };
    }
    if (!/^https?:\/\//i.test(site.url)) {
      setSource(null);
      return () => { active = false; };
    }
    setSource(null);
    fetch(`https://api.microlink.io/?url=${encodeURIComponent(site.url)}`)
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((result) => {
        if (!active) return;
        const ogImage = result?.data?.image?.url;
        if (ogImage) setSource(ogImage);
        else { setTriedScreenshot(true); setSource(screenshotUrl(site.url, refreshKey)); }
      })
      .catch(() => {
        if (active) { setTriedScreenshot(true); setSource(screenshotUrl(site.url, refreshKey)); }
      });
    return () => { active = false; };
  }, [site.image, site.url, refreshKey]);

  if (source) return <img src={source} alt={`${site.title} 原網站縮圖`} onError={() => {
    if (!triedScreenshot && /^https?:\/\//i.test(site.url)) {
      setTriedScreenshot(true);
      setSource(screenshotUrl(site.url, refreshKey));
    } else setSource(null);
  }} />;
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
  const [refreshes, setRefreshes] = useState<Record<string, number>>({});
  const [syncState, setSyncState] = useState<"loading" | "synced" | "local">("loading");

  useEffect(() => {
    let active = true;
    const localSites = loadSites();
    setSites(localSites);
    loadSheetSites()
      .then((sheetSites) => {
        if (!active) return;
        setSites(sheetSites);
        saveSites(sheetSites);
        setSyncState("synced");
      })
      .catch(() => {
        if (active) setSyncState("local");
      });
    return () => { active = false; };
  }, []);
  const categories = useMemo(() => ["全部", ...Array.from(new Set(sites.map((site) => site.category)))], [sites]);
  const visible = sites.filter((site) => (category === "全部" || site.category === category) && `${site.title} ${site.description}`.toLowerCase().includes(query.toLowerCase()));

  function update(next: Site[]) { setSites(next); saveSites(next); setMenu(null); }
  function toggleFavorite(id: string) { update(sites.map((site) => site.id === id ? { ...site, favorite: !site.favorite } : site)); }
  function remove(id: string) { if (confirm("確定要從入口頁移除這個網站嗎？")) update(sites.filter((site) => site.id !== id)); }
  function refreshThumbnail(id: string) {
    setRefreshes((current) => ({ ...current, [id]: Date.now() }));
    setMenu(null);
  }

  return (
    <main>
      <Header />
      <section className="hero">
        <div>
          <p className="eyebrow">MY DIGITAL UNIVERSE</p>
          <h1>我的網站，<em>一站匯聚。</em></h1>
          <p className="hero-copy">歡迎來到雅真匯。收藏每一個重要網站，讓靈感、工作與生活，都在這裡輕盈相遇。</p>
        </div>
        <div className="hero-stat"><strong>{String(sites.length).padStart(2, "0")}</strong><span>個網站<br />已收錄</span></div>
      </section>

      <section className="controls" aria-label="網站篩選工具">
        <div className="search"><span>⌕</span><input aria-label="搜尋網站" placeholder="搜尋網站名稱或內容..." value={query} onChange={(e) => setQuery(e.target.value)} /></div>
        <div className="categories">
          {categories.map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}
        </div>
        <p className={`sync-state ${syncState}`} aria-live="polite">{syncState === "loading" ? "正在載入試算表資料…" : syncState === "synced" ? "✓ 已從 Google 試算表載入" : "目前顯示此瀏覽器的暫存資料"}</p>
      </section>

      <section className="gallery">
        <div className="section-title"><h2>{category === "全部" ? "網站總覽" : category}</h2><span>{visible.length} 個結果</span></div>
        {visible.length ? <div className="site-grid">
          {visible.map((site, index) => (
            <article className="site-card" key={site.id}>
              <a className="thumbnail" href={site.url} target={site.url === "#" ? undefined : "_blank"} rel="noreferrer"><Preview site={site} refreshKey={refreshes[site.id]} /><span className="open-pill">開啟 ↗</span></a>
              <div className="card-body">
                <div className="card-meta"><span className="number">{String(index + 1).padStart(2, "0")}</span><span className="category-dot" style={{ background: site.color }} /> <span>{site.category}</span></div>
                <div className="card-heading"><h3>{site.title}</h3><button aria-label={`${site.title} 更多選項`} onClick={() => setMenu(menu === site.id ? null : site.id)}>•••</button></div>
                <p>{site.description}</p>
                {site.favorite && <span className="favorite">★ 常用</span>}
                {menu === site.id && <div className="card-menu"><button onClick={() => refreshThumbnail(site.id)}>重新整理縮圖</button><button onClick={() => toggleFavorite(site.id)}>{site.favorite ? "取消常用" : "設為常用"}</button><button className="danger" onClick={() => remove(site.id)}>移除網站</button></div>}
              </div>
            </article>
          ))}
          <a className="add-card" href={appHref("/add")}><span>＋</span><strong>新增一個網站</strong><small>建立新的快速入口</small></a>
        </div> : <div className="empty"><strong>沒有找到符合的網站</strong><p>試著更換關鍵字或分類。</p></div>}
      </section>
      <footer><span>YAJEN HUB · 雅真匯</span><span>我的網站，一站匯聚。</span></footer>
    </main>
  );
}

export function AddSite() {
  const colors = ["#C9C0FF", "#F6B8D4", "#A9E5F1", "#BFE6D3", "#F7D6A3", "#C8D9FF"];
  const [color, setColor] = useState(colors[0]);
  const [image, setImage] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("工作工具");
  const [syncToken, setSyncToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => setSyncToken(localStorage.getItem(SYNC_TOKEN_KEY) || ""), []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setSaveError("");
    const form = new FormData(event.currentTarget);
    const current = loadSites();
    const url = String(form.get("url") || "");
    const next: Site = { id: crypto.randomUUID(), title, url: /^https?:\/\//i.test(url) ? url : `https://${url}`, category, description: String(form.get("description") || ""), image, color };
    try {
      if (!SHEET_API_URL) throw new Error("Google 試算表尚未完成連線設定。");
      await fetch(SHEET_API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "addSite", token: syncToken, site: next }),
      });
      localStorage.setItem(SYNC_TOKEN_KEY, syncToken);
      saveSites([next, ...current]);
      window.location.href = appHref("/");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "無法寫入 Google 試算表，請稍後再試。");
      setSaving(false);
    }
  }

  return (
    <main>
      <Header />
      <section className="add-layout">
        <div className="form-intro"><a href={appHref("/")}>← 返回雅真匯</a><p className="eyebrow">ADD TO YAJEN HUB</p><h1>收藏你的<br /><em>下一個入口。</em></h1><p>填入網站資訊，它就會出現在雅真匯首頁，成為你數位世界的一部分。</p></div>
        <form className="site-form" onSubmit={submit}>
          <div className="form-section"><span>01</span><h2>基本資訊</h2></div>
          <label>網站名稱<input required value={title} onChange={(e) => setTitle(e.target.value)} name="title" placeholder="例如：課程管理系統" /></label>
          <label>網站網址<input required name="url" type="text" inputMode="url" placeholder="https://example.com" /></label>
          <div className="two-col"><label>分類<select required value={category} onChange={(e) => setCategory(e.target.value)} name="category"><option value="工作工具">工作工具</option><option value="教學資源">教學資源</option><option value="專案計畫">專案計畫</option><option value="常用服務">常用服務</option><option value="個人收藏">個人收藏</option><option value="靈感探索">靈感探索</option><option value="其他">其他</option></select></label><label>卡片色彩<span className="color-row">{colors.map((item) => <button type="button" aria-label={`選擇色彩 ${item}`} className={color === item ? "selected" : ""} style={{ background: item }} onClick={() => setColor(item)} key={item} />)}</span></label></div>
          <label>簡短說明<textarea required name="description" rows={3} placeholder="這個網站主要用來做什麼？" /></label>
          <div className="form-section second"><span>02</span><h2>網站縮圖</h2></div>
          <label>自訂縮圖網址 <small>選填；留白會自動取得原網站縮圖</small><input value={image} onChange={(e) => setImage(e.target.value)} name="image" type="url" placeholder="https://example.com/preview.jpg" /></label>
          <label>Google 試算表同步金鑰 <small>只保存在這個瀏覽器，不會上傳到 GitHub</small><input required value={syncToken} onChange={(e) => setSyncToken(e.target.value)} name="syncToken" type="password" autoComplete="off" placeholder="請輸入同步金鑰" /></label>
          <div className="live-preview"><span>卡片預覽</span><div className="mini-card"><Preview site={{ id: "preview", title: title || "你的網站名稱", url: "#", category, description: "", image, color }} /><strong>{title || "你的網站名稱"}</strong><small>{category}</small></div></div>
          {saveError && <p className="save-error" role="alert">{saveError}</p>}
          <div className="form-actions"><a href={appHref("/")}>取消</a><button type="submit" disabled={saving}>{saving ? "正在同步試算表…" : "儲存並新增網站"} <span>{saving ? "" : "→"}</span></button></div>
        </form>
      </section>
    </main>
  );
}
