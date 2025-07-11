// === Основной конфиг тем ===
const themeNames = {
  relationship: "Семья и отношения",
  health: "Здоровье",
  food: "Питание и кулинария",
  finance: "Деньги и финансы",
  law: "Законы и документы",
  routine: "Быт и повседневная жизнь",
  beautiness: "Красота и уход",
  repair: "Дом и ремонт",
  tech: "Гаджеты и техника",
  other: "Разное"
};

// === Параметры адаптивности ===
const BASE_FONT_SIZE = parseFloat(getComputedStyle(document.documentElement).fontSize);
const ARTICLE_MIN_WIDTH_REM = 26; // Минимальная ширина статьи в rem

function getArticlesPerRow() {
  const container = document.getElementById("article-container") || document.body;
  const containerWidth = container.clientWidth;
  const articleMinWidthPx = ARTICLE_MIN_WIDTH_REM * BASE_FONT_SIZE;
  return Math.max(1, Math.floor(containerWidth / articleMinWidthPx));
}

// === Хелперы ===
function getSlugFromPath() {
  const path = window.location.pathname;
  return path.split("/").pop().replace(".html", "");
}

function truncate(text, length = 160) {
  return text.length > length ? text.slice(0, length) + "..." : text;
}

function createStandardArticleBlock(a, withAd = true) {
  const wrapper = document.createElement("div");
  wrapper.className = "article-with-ad";

  const article = document.createElement("article");

  const link = document.createElement("a");
  link.href = `/static/articles/${a.slug}.html`;
  link.className = "image";
  link.innerHTML = `<img src="${a.image}" alt="">`;

  const title = document.createElement("h3");
  title.textContent = a.title;

  const description = document.createElement("p");
  description.textContent = truncate(a.intro || "Описание недоступно");

  const actions = document.createElement("ul");
  actions.className = "actions";
  const li = document.createElement("li");
  const btn = document.createElement("a");
  btn.href = `/static/articles/${a.slug}.html`;
  btn.className = "button";
  btn.textContent = "Читать";
  li.appendChild(btn);
  actions.appendChild(li);

  article.appendChild(link);
  article.appendChild(title);
  article.appendChild(description);
  article.appendChild(actions);

  wrapper.appendChild(article);

  if (withAd) {
    const ad = document.createElement("div");
    ad.className = "adblock";
    ad.textContent = "Реклама";
    wrapper.appendChild(ad);
  }

  return wrapper;
}

// === Загрузка названия сайта ===
async function loadSiteName() {
  const title = document.getElementById("site-name");
  title.textContent = "Все про все";
  document.title = document.title + " | Все про все";
}

// === Загрузка заглавия странцы ===
async function loadPageHeading() {
  const params = new URLSearchParams(window.location.search);
  const theme = params.get("theme");

  const heading = document.getElementById("page-title");
  if (theme && themeNames[theme]) {
    heading.textContent = themeNames[theme];
    document.title = themeNames[theme];
  } else {
    heading.textContent = "Популярные статьи";
    document.title = "Популярные статьи";
  }
}

// === Загрузка заглавия результатов поиска ===
async function loadSearchResultTitle() {
  const params = new URLSearchParams(window.location.search);
  const query = params.get("q");

  const heading = document.getElementById("search-result-title");
  heading.textContent = "Результаты поиска по запросу «" + query + "»";
  document.title = "Поиск — " + query;
}

// === Загрузка популярных ===
async function loadPopularArticles() {
  const container = document.getElementById("article-container");
  if (!container) return;

  const itemsPerRow = getArticlesPerRow();
  const params = new URLSearchParams(window.location.search);
  const theme = params.get("theme");
  const url = theme ? `https://seo-site-backend-production.up.railway.app/api/random_articles?theme=${encodeURIComponent(theme)}` : "https://seo-site-backend-production.up.railway.app/api/random_articles";

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Не удалось загрузить статьи");
    const articles = await res.json();
    container.innerHTML = "";

    if (articles.length === 0) {
      container.innerHTML = "<p>Статей по выбранной теме не найдено.</p>";
      return;
    }

    for (let i = 0; i < articles.length; i += itemsPerRow) {
      const row = document.createElement("div");
      row.className = "posts";

      for (let j = i; j < i + itemsPerRow && j < articles.length; j++) {
        const a = articles[j];
        const block = createStandardArticleBlock(a, true); // статья + реклама
        row.appendChild(block);
      }

      container.appendChild(row);
    }
  } catch (err) {
    console.error("Ошибка при загрузке статей:", err);
    container.innerHTML = "<p>Ошибка загрузки статей</p>";
  }
}


// === Загрузка свежих ===
async function loadRecentArticles() {
  const container = document.getElementById("article-container");
  if (!container) return;

  const itemsPerRow = getArticlesPerRow();

  try {
    const res = await fetch("https://seo-site-backend-production.up.railway.app/api/recent_articles");
    if (!res.ok) throw new Error("Ошибка загрузки");
    const articles = await res.json();
    container.innerHTML = "";

    for (let i = 0; i < articles.length; i += itemsPerRow) {
      const row = document.createElement("div");
      row.className = "posts";

      for (let j = i; j < i + itemsPerRow && j < articles.length; j++) {
        const block = createStandardArticleBlock(articles[j], true);
        row.appendChild(block);
      }

      container.appendChild(row);
    }
  } catch (err) {
    console.warn("Ошибка загрузки свежих статей:", err);
  }
}


// === Загрузка свежих (кратко) ===
async function loadRecentArticlesSidebar() {
  const container = document.getElementById("recent-articles");
  if (!container) return;
  try {
    const res = await fetch("https://seo-site-backend-production.up.railway.app/api/recent_articles");
    if (!res.ok) throw new Error("Ошибка загрузки");
    const articles = await res.json();
    container.innerHTML = "";
    articles.forEach(a => {
      const block = createStandardArticleBlock(a, true);
      container.appendChild(block);
    });
  } catch (err) {
    console.warn("Ошибка загрузки свежих статей:", err);
  }
}

// === Поиск ===
async function loadSearchResults() {
  const container = document.getElementById("article-container");
  if (!container) return;

  const query = new URLSearchParams(window.location.search).get("q");
  if (!query) return;

  const itemsPerRow = getArticlesPerRow();

  try {
    const res = await fetch(`https://seo-site-backend-production.up.railway.app/api/look_for_articles?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error("Ошибка поиска");

    const articles = await res.json();
    container.innerHTML = "";

    if (articles.length === 0) {
      container.innerHTML = `<p>По запросу "${query}" ничего не найдено.</p>`;
      return;
    }

    for (let i = 0; i < articles.length; i += itemsPerRow) {
      const row = document.createElement("div");
      row.className = "posts";

      for (let j = i; j < i + itemsPerRow && j < articles.length; j++) {
        const block = createStandardArticleBlock(articles[j], true);
        row.appendChild(block);
      }

      container.appendChild(row);
    }

  } catch (err) {
    console.warn("Ошибка поиска:", err);
  }
}


// === Похожие статьи ===
async function loadSimilarArticles() {
  const container = document.getElementById("similar-articles");
  if (!container) return;
  const slug = getSlugFromPath();
  if (!slug) return;
  try {
    const res = await fetch(`https://seo-site-backend-production.up.railway.app/api/similar_articles?slug=${encodeURIComponent(slug)}`);
    if (!res.ok) throw new Error("Не удалось загрузить похожие статьи");
    const articles = await res.json();
    container.innerHTML = "";
    if (articles.length === 0) {
      container.innerHTML = "<p>Похожие статьи не найдены.</p>";
      return;
    }
    articles.forEach(a => {
      const block = createStandardArticleBlock(a, true);
      container.appendChild(block);
    });
  } catch (err) {
    console.warn("Ошибка загрузки похожих статей:", err);
  }
}

// === Загрузка тем ===
async function loadThemes() {
  try {
    const res = await fetch("https://seo-site-backend-production.up.railway.app/api/themes");
    if (!res.ok) throw new Error("Темы не получены");
    const themes = await res.json();
    const menu = document.getElementById("menu-items") || document.querySelector("#menu ul");
    themes.forEach(t => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = `/static/index.html?theme=${encodeURIComponent(t.slug)}`;
      a.textContent = `Статьи по теме: ${t.name}`;
      li.appendChild(a);
      menu.appendChild(li);
    });
  } catch (err) {
    console.warn("Ошибка загрузки тем:", err);
  }
}

// === Запуск ===
document.addEventListener("DOMContentLoaded", () => {
  loadThemes();
  loadFooterAd();
  loadDynamicAd();
  loadRecentArticlesSidebar();

  const bodyId = document.body.id;

  switch (bodyId) {
    case "index-page":
      loadPopularArticles();
      loadPageHeading();
      break;
    case "recent-page":
      loadRecentArticles();
      break;
    case "search-page":
      loadSearchResults();
      loadSearchResultTitle();
      break;
    case "article-page":
      loadSimilarArticles();
      break;
  }
  loadSiteName();
});

function loadDynamicAd() {
  const block = document.getElementById("dynamic-ad-bottom");
  if (!block) return;
  setTimeout(() => {
    block.innerHTML = '<iframe src="https://example.com/ad.html" style="width:100%;height:100px;border:none;"></iframe>';
  }, 1500);
}

function loadFooterAd() {
  const block = document.getElementById("footer-ad");
  if (block) block.textContent = "Здесь могла бы быть ваша реклама (footer)";
}
