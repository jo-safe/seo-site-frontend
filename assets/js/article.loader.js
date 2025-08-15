// === Основной конфиг тем ===
const themeNames = {
  life: "Образ жизни",
  work: "Работа и учёба",
  lifehacks: "Советы и лайфхаки",
  devices: "Гаджеты и устройства",
  technologies: "Технологии и интернет",
  food: "Еда и дом",
  sport: "Спорт и здоровье",
  travelling: "Путешествия",
  auto: "Авто",
  art: "Развлечения и искусство",
  law: "Право и финансы",
  news: "Новости"
};

// === Параметры адаптивности ===
const BASE_FONT_SIZE = parseFloat(getComputedStyle(document.documentElement).fontSize);
const ARTICLE_MIN_WIDTH_REM = 26; // Минимальная ширина статьи в rem

let popularArticles = [];
let renderedIndex = 0;
const BLOCK_BATCH_COUNT = 5;

let similarArticles = [];
let similarRenderedIndex = 0;

function getArticlesPerRow() {
  const container = document.getElementsByClassName("inner");
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
    heading.textContent = "Популярное";
    document.title = "Популярное";
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
    ? `https://seo-site-backend-production.up.railway.app/api/random_articles?theme=${encodeURIComponent(theme)}&count=${itemsPerRow*BLOCK_BATCH_COUNT}`
    : `https://seo-site-backend-production.up.railway.app/api/random_articles?count=${itemsPerRow*BLOCK_BATCH_COUNT}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Не удалось загрузить статьи");

    popularArticles = await res.json();
    container.innerHTML = "";
    renderedIndex = 0;

    renderNextPopularBlocks(container, itemsPerRow);
  } catch (err) {
    console.error("Ошибка при загрузке статей:", err);
    container.innerHTML = "<p>Ошибка загрузки статей</p>";
  }
}

function renderNextPopularBlocks(container, itemsPerRow) {
  const total = popularArticles.length;
  const start = renderedIndex;
  const end = Math.min(total, renderedIndex + (itemsPerRow * BLOCK_BATCH_COUNT));

  // Удалим старую кнопку
  const oldButton = document.getElementById("load-more");
  if (oldButton) oldButton.remove();

  // Отрисовываем пачками
  for (let i = start; i < end; i += itemsPerRow) {
    const row = document.createElement("div");
    row.className = "posts";

    for (let j = i; j < i + itemsPerRow && j < end; j++) {
      const block = createStandardArticleBlock(popularArticles[j], true);
      row.appendChild(block);
    }

    container.appendChild(row);
  }

  renderedIndex = end;

  if (renderedIndex < total) {
    insertLoadMoreButton(container, () => {
      renderNextPopularBlocks(container, itemsPerRow);
    });
  }
}

function insertLoadMoreButton(container, onClick) {
  const wrapper = document.createElement("div");
  wrapper.style.textAlign = "center";
  wrapper.style.margin = "2rem 0";

  const btn = document.createElement("button");
  btn.id = "load-more";
  btn.className = "button";
  btn.textContent = "Загрузить ещё";

  btn.addEventListener("click", onClick);

  wrapper.appendChild(btn);
  container.appendChild(wrapper);
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
  itemsPerRow = getArticlesPerRow()
  const total = similarArticles.length;
  const start = renderedIndex;
  const end = Math.min(total, renderedIndex + (itemsPerRow * BLOCK_BATCH_COUNT));

  const container = document.getElementById("similar-articles");
  if (!container) return;

    // Отрисовываем пачками
  for (let i = start; i < end; i += itemsPerRow) {
    const row = document.createElement("div");
    row.className = "posts";

    const end = Math.min(similarRenderedIndex + itemsPerRow, similarArticles.length);
    for (let i = similarRenderedIndex; i < end; i++) {
      const block = createStandardArticleBlock(similarArticles[i], true);
      row.appendChild(block);
    }
    container.appendChild(row);
    similarRenderedIndex = end;
  }

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
    const res = await fetch(`https://seo-site-backend-production.up.railway.app/api/similar_articles?slug=${encodeURIComponent(slug)}&limit=${3*getArticlesPerRow()}`);
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
      a.textContent = `${t.name}`;
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

  // Создаём HTML-рекламный блок
  function createAdBlock(text = "Реклама (заглушка)") {
    const adBlock = document.createElement("div");
    adBlock.className = "adblock";
    adBlock.textContent = text;
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
    return adBlock;
  }

  // Вставляем перед каждым <h2>
  headings.forEach((h2) => {
    const adBlock = createAdBlock();
    h2.parentNode.insertBefore(adBlock, h2);
  });

  // Вставляем один рекламный блок в конец
  const finalAdBlock = createAdBlock("Реклама в конце статьи");
  container.appendChild(finalAdBlock);
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
