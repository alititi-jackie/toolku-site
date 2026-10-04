/* ToolKu 互动增强：收藏 / 最近使用 / 历史记录 / 复制结果 / 反馈 / 深色模式
* 纯前端，localStorage 本地存储，不收集任何数据。所有注入均为防御式，缺元素时静默跳过。 */
(() => {
const store = {
get(k, d) {
try {
const v = localStorage.getItem(k);
return v? JSON.parse(v): d;
} catch {
return d;
}
},
set(k, v) {
try {
localStorage.setItem(k, JSON.stringify(v));
} catch {}
},
};
const FAV_KEY = "tk_fav_v1";
const RECENT_KEY = "tk_recent_v1";
const HIST_KEY = "tk_hist_v1";
const THEME_KEY = "tk_theme_v1";
const MAX_RECENT = 8;
const MAX_HIST = 10;

const TK = (window.TK = window.TK || {});

/* ---------- 当前页面身份 ---------- */
function pageInfo() {
const path = location.pathname;
if (path === "/" || path === "/index.html") return null;
const h1 = document.querySelector("main h1");
const name = (h1? h1.textContent: document.title).trim().split("｜")[0].slice(0, 40);
return { url: path, name: name || document.title.slice(0, 40)};
}

/* ---------- 轻提示 ---------- */
let toastTimer = 0;
function toast(msg) {
let t = document.querySelector(".tk-toast");
if (!t) {
t = document.createElement("div");
t.className = "tk-toast";
t.setAttribute("role", "status");
document.body.appendChild(t);
}
t.textContent = msg;
t.classList.add("show");
clearTimeout(toastTimer);
toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}
TK.toast = toast;

/* ---------- 收藏 ---------- */
TK.getFavs = () => store.get(FAV_KEY, []);
TK.isFav = (url) => TK.getFavs().some((f) => f.url === url);
TK.toggleFav = (info) => {
const favs = TK.getFavs();
const i = favs.findIndex((f) => f.url === info.url);
if (i >= 0) {
favs.splice(i, 1);
toast("已取消收藏");
} else {
favs.unshift({ url: info.url, name: info.name});
toast("已收藏 ⭐");
}
store.set(FAV_KEY, favs.slice(0, 50));
paintFavBtn();
renderPersonal();
};

/* ---------- 最近使用 ---------- */
TK.getRecent = () => store.get(RECENT_KEY, []);
TK.pushRecent = (info) => {
if (!info) return;
const list = TK.getRecent().filter((r) => r.url!== info.url);
list.unshift({ url: info.url, name: info.name, t: Date.now()});
store.set(RECENT_KEY, list.slice(0, MAX_RECENT));
};

/* ---------- 计算历史（按工具 key） ---------- */
TK.getHistory = (key) => (store.get(HIST_KEY, {})[key] || []);
TK.clearHistory = (key) => {
const all = store.get(HIST_KEY, {});
delete all[key];
store.set(HIST_KEY, all);
renderHistory(key);
};
// 供 calculators.js / new-calculators.js 在每次出结果时调用
TK._lastResult = "";
TK.onResult = (toolKey, text) => {
if (!toolKey ||!text) return;
TK._lastResult = text;
const all = store.get(HIST_KEY, {});
const list = all[toolKey] || [];
const entry = { t: Date.now(), text: text.slice(0, 200)};
if (!list.length || list[0].text!== entry.text) {
list.unshift(entry);
all[toolKey] = list.slice(0, MAX_HIST);
store.set(HIST_KEY, all);
}
renderHistory(toolKey);
const shareBtn = document.querySelector(".tk-share-btn");
if (shareBtn) shareBtn.disabled = false;
};

function fmtTime(t) {
try {
return new Date(t).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit"});
} catch {
return "";
}
}
function renderHistory(toolKey) {
const box = document.querySelector(".tk-history-list");
if (!box) return;
const list = TK.getHistory(toolKey || document.body.dataset.tool || location.pathname);
const det = box.closest("details");
if (det) det.querySelector("summary").textContent = `历史记录（${list.length}）`;
box.innerHTML = list.length
? list
.map(
(e) =>
`<li><span class="tk-hist-text">${escapeHtml(e.text)}</span><span class="tk-hist-time">${fmtTime(e.t)}</span></li>`
)
.join("")
: '<li class="tk-empty">暂无历史，算一次就会记在这里</li>';
}
function escapeHtml(s) {
return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));
}

/* ---------- 复制结果 ---------- */
TK.copyResult = async () => {
const text = TK._lastResult;
if (!text) {
toast("先算一次再复制");
return;
}
try {
await navigator.clipboard.writeText(text);
toast("结果已复制 ✓");
} catch {
const ta = document.createElement("textarea");
ta.value = text;
document.body.appendChild(ta);
ta.select();
try {
document.execCommand("copy");
toast("结果已复制 ✓");
} catch {
toast("复制失败，请手动复制");
}
ta.remove();
}
};

/* ---------- 反馈 ---------- */
TK.feedbackUrl = () => {
const title = encodeURIComponent("" + document.title.split("｜")[0]);
const body = encodeURIComponent("页面：" + location.href + "\n\n问题描述：\n\n期望结果：\n");
return `https://github.com/alititi-jackie/toolku-site/issues/new?title=${title}&body=${body}`;
};

/* ---------- 深色模式 ---------- */
TK.toggleTheme = () => {
const cur = document.documentElement.dataset.theme === "dark"? "": "dark";
if (cur) document.documentElement.dataset.theme = cur;
else delete document.documentElement.dataset.theme;
store.set(THEME_KEY, cur || "light");
paintThemeBtn();
};
function initTheme() {
if (store.get(THEME_KEY, "light") === "dark") document.documentElement.dataset.theme = "dark";
}

/* ---------- 注入：收藏按钮 ---------- */
let favBtn = null;
function paintFavBtn() {
if (!favBtn) return;
const info = pageInfo();
const on = info && TK.isFav(info.url);
favBtn.textContent = on? "★ 已收藏": "☆ 收藏";
favBtn.classList.toggle("on",!!on);
favBtn.setAttribute("aria-pressed", on? "true": "false");
}
function injectFavBtn() {
const info = pageInfo();
if (!info) return;
const h1 = document.querySelector("main h1");
if (!h1) return;
favBtn = document.createElement("button");
favBtn.type = "button";
favBtn.className = "tk-fav-btn";
favBtn.addEventListener("click", () => TK.toggleFav(info));
h1.insertAdjacentElement("afterend", favBtn);
paintFavBtn();
}

/* ---------- 注入：主题切换 ---------- */
let themeBtn = null;
function paintThemeBtn() {
if (!themeBtn) return;
const dark = document.documentElement.dataset.theme === "dark";
themeBtn.textContent = dark? "☀️": "🌙";
themeBtn.title = dark? "切换浅色模式": "切换深色模式";
}
function injectThemeBtn() {
const nav = document.querySelector(".site-header nav");
if (!nav) return;
themeBtn = document.createElement("button");
themeBtn.type = "button";
themeBtn.className = "tk-theme-btn";
themeBtn.setAttribute("aria-label", "切换深色模式");
themeBtn.addEventListener("click", TK.toggleTheme);
nav.appendChild(themeBtn);
paintThemeBtn();
}

/* ---------- 注入：页脚反馈 ---------- */
function injectFeedback() {
const footer = document.querySelector("footer");
if (!footer || footer.querySelector(".tk-feedback")) return;
const a = document.createElement("a");
a.className = "tk-feedback";
a.href = TK.feedbackUrl();
a.target = "_blank";
a.rel = "noopener";
a.textContent = "💬 问题反馈";
footer.appendChild(document.createTextNode(" · "));
footer.appendChild(a);
}

/* ---------- 注入：历史 + 分享（计算器页） ---------- */
function injectResultTools() {
const result = document.getElementById("result");
const calcBtn = document.getElementById("calculate");
if (!result ||!calcBtn) return;
const toolKey = document.body.dataset.tool || location.pathname;
// 分享按钮
const shareBtn = document.createElement("button");
shareBtn.type = "button";
shareBtn.className = "tk-share-btn";
shareBtn.textContent = "📋 复制结果";
shareBtn.disabled = true;
shareBtn.addEventListener("click", TK.copyResult);
calcBtn.insertAdjacentElement("afterend", shareBtn);
// 历史记录
const det = document.createElement("details");
det.className = "tk-history";
det.innerHTML = `<summary>历史记录（0）</summary><ul class="tk-history-list"></ul><button type="button" class="tk-history-clear">清空历史</button>`;
det.querySelector(".tk-history-clear").addEventListener("click", (e) => {
e.preventDefault();
TK.clearHistory(toolKey);
toast("历史已清空");
});
result.insertAdjacentElement("afterend", det);
renderHistory(toolKey);
}

/* ---------- 首页：收藏 / 最近 ---------- */
function chip(item) {
return `<a class="tk-chip" href="${escapeHtml(item.url)}">${escapeHtml(item.name)}</a>`;
}
function renderPersonal() {
const favBox = document.getElementById("tk-fav-list");
const recBox = document.getElementById("tk-recent-list");
if (!favBox &&!recBox) return;
const favs = TK.getFavs();
const recents = TK.getRecent();
const sec = document.getElementById("tk-personal");
if (sec) sec.hidden =!(favs.length || recents.length);
if (favBox) {
favBox.innerHTML = favs.length? favs.map(chip).join(""): '<span class="tk-empty">还没有收藏，在工具页点 ☆ 收藏常用工具</span>';
favBox.closest(".tk-personal-block").hidden = !favs.length;
}
if (recBox) {
recBox.innerHTML = recents.length? recents.map(chip).join(""): '<span class="tk-empty">暂无</span>';
recBox.closest(".tk-personal-block").hidden =!recents.length;
}
}

/* ---------- 启动 ---------- */
initTheme();
injectThemeBtn();
injectFavBtn();
injectFeedback();
injectResultTools();
const info = pageInfo();
if (info) TK.pushRecent(info);
renderPersonal();
})();
