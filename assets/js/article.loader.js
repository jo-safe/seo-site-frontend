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

let popularArticles = []; // Все загруженные статьи
let renderedIndex = 0; // Сколько уже отрисовали
const BATCH_SIZE = 5;

let similarArticles = [];
let similarRenderedIndex = 0;

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
  link.href = `articles/${a.slug}.html`;
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
  btn.href = `articles/${a.slug}.html`;
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
  const url = theme
    ? `https://seo-site-backend-production.up.railway.app/api/random_articles?theme=${encodeURIComponent(theme)}`
    : "https://seo-site-backend-production.up.railway.app/api/random_articles";

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Не удалось загрузить статьи");

    popularArticles = await res.json();
    container.innerHTML = "";

    if (popularArticles.length === 0) {
      container.innerHTML = "<p>Статей по выбранной теме не найдено.</p>";
      return;
    }

    renderNextPopularBatch(container, itemsPerRow);

    insertLoadMoreButton(container, () => {
      renderNextPopularBatch(container, itemsPerRow);
    });

  } catch (err) {
    console.error("Ошибка при загрузке статей:", err);
    container.innerHTML = "<p>Ошибка загрузки статей</p>";
  }
}

function renderNextPopularBatch(container, itemsPerRow) {
  const end = Math.min(renderedIndex + BATCH_SIZE, popularArticles.length);

  for (let i = renderedIndex; i < end; i += itemsPerRow) {
    const row = document.createElement("div");
    row.className = "posts";

    for (let j = i; j < i + itemsPerRow && j < end; j++) {
      const block = createStandardArticleBlock(popularArticles[j], true);
      row.appendChild(block);
    }

    container.appendChild(row);
  }

  renderedIndex = end;

  if (renderedIndex >= popularArticles.length) {
    const loadMoreBtn = document.getElementById("load-more");
    if (loadMoreBtn) loadMoreBtn.remove();
  }
}

function insertLoadMoreButton(container, onClick) {
  const btn = document.createElement("button");
  btn.id = "load-more";
  btn.className = "button";
  btn.textContent = "Загрузить ещё";

  btn.addEventListener("click", () => {
    onClick();
  });

  container.appendChild(btn);
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
function renderSimilarBatch() {
  const container = document.getElementById("similar-articles");
  if (!container) return;

  const end = Math.min(similarRenderedIndex + BATCH_SIZE, similarArticles.length);
  for (let i = similarRenderedIndex; i < end; i++) {
    const block = createStandardArticleBlock(similarArticles[i], true);
    container.appendChild(block);
  }
  similarRenderedIndex = end;

  if (similarRenderedIndex >= similarArticles.length) {
    const btn = document.getElementById("load-more");
    if (btn) btn.remove();
  }
}

async function loadSimilarArticles() {
  const container = document.getElementById("similar-articles");
  if (!container) return;
  const slug = getSlugFromPath();
  if (!slug) return;

  try {
    const res = await fetch(`https://seo-site-backend-production.up.railway.app/api/similar_articles?slug=${encodeURIComponent(slug)}`);
    if (!res.ok) throw new Error("Не удалось загрузить похожие статьи");

    similarArticles = await res.json();
    container.innerHTML = "";

    renderSimilarBatch();
    insertLoadMoreButton(container, renderSimilarBatch);

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
      a.href = `index.html?theme=${encodeURIComponent(t.slug)}`;
      a.textContent = `Статьи по теме: ${t.name}`;
      li.appendChild(a);
      menu.appendChild(li);
    });
  } catch (err) {
    console.warn("Ошибка загрузки тем:", err);
  }
}

function insertAdBlocksInArticle() {
  const container = document.querySelector("#article-content");
  if (!container) return;

  const headings = container.querySelectorAll("h2");
  if (!headings.length) return;

  headings.forEach((h2, index) => {
    const adBlock = document.createElement("div");
    adBlock.className = "adblock";
    adBlock.textContent = "Реклама (заглушка)";
    adBlock.style.cssText = `
      background: #f0f0f0;
      padding: 10px;
      margin: 20px 0;
      text-align: center;
      font-weight: bold;
      color: #555;
      border: 1px dashed #aaa;
      border-radius: 6px;
    `;

    // Вставляем блок перед каждым h2
    h2.parentNode.insertBefore(adBlock, h2);
  });
}


// === Запуск ===
document.addEventListener("DOMContentLoaded", () => {
  loadThemes();
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
      insertAdBlocksInArticle();
      break;
  }
  loadSiteName();
});

document.addEventListener("DOMContentLoaded", () => {
  const loadMoreBtn = document.getElementById("load-more");
  if (!loadMoreBtn) return;

  loadMoreBtn.addEventListener("click", async () => {
    loadMoreBtn.disabled = true;
    loadMoreBtn.textContent = "Загрузка...";

    try {
      const newArticles = await fetchMoreArticles(); // твоя функция
      renderArticles(newArticles); // отрисуй

      if (!hasMoreArticles()) {
        loadMoreBtn.style.display = "none"; // Спрячь, если больше нечего грузить
      } else {
        loadMoreBtn.disabled = false;
        loadMoreBtn.textContent = "Загрузить ещё";
      }
    } catch (e) {
      console.error("Ошибка при загрузке статей", e);
      loadMoreBtn.disabled = false;
      loadMoreBtn.textContent = "Попробовать ещё раз";
    }
  });
});
