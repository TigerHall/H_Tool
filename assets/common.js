/* =========================================================
   H_Tool · 主页逻辑
   - 动态渲染工具卡片（支持 icon / tag / accent / comingSoon）
   - 浅色 / 深色主题切换（localStorage 记忆）
   - 内嵌兜底数据：即使 links.json 加载失败（如本地 file:// 直接打开）也能正常展示
   ========================================================= */

// 兜底数据：与 assets/links.json 保持一致，用于离线 / 直接打开 HTML 时降级
const FALLBACK_LINKS = [
  {
    title: "大疆无人机GPS信息查看器",
    url: "大疆无人机GPS等信息查看器/index.html",
    description: "查看大疆无人机拍摄照片中的 GPS、高度、镜头朝向等 EXIF 信息。",
    icon: "🛰️",
    tag: "影像工具",
    accent: "#10b981",
  },
  {
    title: "ADCP数据处理工具",
    url: "page/adcp.html",
    description: "处理并提取水文 ADCP 流速流向整点层位数据，支持导出。",
    icon: "🌊",
    tag: "数据处理",
    accent: "#0ea5e9",
  },
  {
    title: "PDF小册子打印工具",
    url: "page/pdfbook.html",
    description: "将 PDF 自动拼版，一键打印小册子、海报或普通文档。",
    icon: "📄",
    tag: "文档打印",
    accent: "#6366f1",
  },
  {
    title: "Edge截图指南",
    url: "小技巧/edge-screenshot-guide.html",
    description: "Microsoft Edge 浏览器长截图与开发者工具截图使用指南。",
    icon: "✂️",
    tag: "使用技巧",
    accent: "#f59e0b",
  },
  {
    title: "更多工具开发中",
    description: "这里将陆续更新更多小工具，敬请期待！",
    icon: "🚀",
    tag: "敬请期待",
    comingSoon: true,
  },
];

/* ---------------- 主题切换 ---------------- */
function initTheme() {
  const root = document.documentElement;
  const toggle = document.getElementById("themeToggle");
  const icon = toggle ? toggle.querySelector(".theme-toggle__icon") : null;

  function apply(theme) {
    root.setAttribute("data-theme", theme);
    if (toggle) toggle.setAttribute("aria-pressed", String(theme === "dark"));
    if (icon) icon.textContent = theme === "dark" ? "☀️" : "🌙";
  }

  const stored = localStorage.getItem("htool-theme");
  const prefersDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  apply(stored || (prefersDark ? "dark" : "light"));

  if (toggle) {
    toggle.addEventListener("click", () => {
      const next =
        root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      apply(next);
      localStorage.setItem("htool-theme", next);
    });
  }
}

/* ---------------- 卡片渲染 ---------------- */
function escapeHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderCards(links) {
  const grid = document.getElementById("toolGrid");
  if (!grid) return;

  const valid = links.filter((l) => l && l.title);
  const toolCount = valid.filter((l) => l.url && !l.comingSoon).length;
  const statEl = document.getElementById("statCount");
  if (statEl) statEl.textContent = toolCount;

  if (valid.length === 0) {
    grid.innerHTML =
      '<p class="error">暂时没有可用的工具，敬请期待更新～</p>';
    return;
  }

  grid.innerHTML = valid
    .map((link, i) => {
      const accent = link.accent || "#10b981";
      const icon = link.icon || "🔧";
      const tag = link.tag || "工具";
      const desc = link.description ? escapeHTML(link.description) : "";
      const styleAttr = `style="--accent:${accent};--i:${i}"`;

      const body = `
        <span class="tool-card__icon" aria-hidden="true">${icon}</span>
        <div class="tool-card__body">
          <span class="tool-card__tag">${escapeHTML(tag)}</span>
          <h3 class="tool-card__title">${escapeHTML(link.title)}</h3>
          ${desc ? `<p class="tool-card__desc">${desc}</p>` : ""}
        </div>`;

      if (!link.url || link.comingSoon) {
        return `<div class="tool-card tool-card--soon" ${styleAttr}>${body}</div>`;
      }
      return `<a class="tool-card" href="${escapeHTML(
        link.url
      )}" ${styleAttr}>${body}<span class="tool-card__arrow" aria-hidden="true">→</span></a>`;
    })
    .join("");
}

/* ---------------- 加载链接数据 ---------------- */
async function loadLinks() {
  let links = null;
  try {
    const res = await fetch("assets/links.json", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.links)) links = data.links;
    }
  } catch (e) {
    /* 本地直接打开等场景会失败，使用兜底数据 */
  }
  renderCards(links || FALLBACK_LINKS);
}

/* ---------------- 初始化 ---------------- */
function initPage() {
  initTheme();
  loadLinks();
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPage);
} else {
  initPage();
}
