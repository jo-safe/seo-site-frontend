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

api_link = "https://api.trendlist.ru/api/"

// === Параметры адаптивности ===
const BASE_FONT_SIZE = parseFloat(getComputedStyle(document.documentElement).fontSize);
const ARTICLE_MIN_WIDTH_REM = 26; // Минимальная ширина статьи в rem

let popularArticles = [];
let renderedIndex = 0;
const BLOCK_BATCH_COUNT = 5;

let similarArticles = [];
let similarRenderedIndex = 0;

function getArticlesPerRow() {
  const container = document.getElementById("header");
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

function createStandardArticleBlock(data, isAd = false) {
  const section = document.createElement("section");

  if (isAd) {
    section.className = "adblock";
    section.innerHTML = `
      <p>Реклама 300×250</p>
    `;
  } else {
    section.innerHTML = `
      <a href="articles/${data.slug}.html" class="image featured">
        <img src="${data.image}" alt="">
      </a>
      <header>
        <h3>${data.title}</h3>
      </header>
      <p>${data.intro}</p>
      <ul class="actions">
        <li><a href="articles/${data.slug}.html" class="button">Читать</a></li>
      </ul>
    `;
  }

  return section;
}


// === Загрузка названия сайта ===
async function loadSiteName() {
  const title = document.getElementById("site-name");
  title.textContent = "Трендлист";
  const descr = document.getElementById("site-descr");
  descr.textContent = "Свежие статьи каждый день"
  document.title = document.title + " | Трендлист";
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
    const container = document.querySelector("#features .row.aln-center");
    if (!container) return;

    const params = new URLSearchParams(window.location.search);
    const theme = params.get("theme");

    // Получаем ID уже отображенных статей
    const renderedArticles = container.querySelectorAll('.article-block');
    const exceptArticles = Array.from(renderedArticles)
        .map(article => article.dataset.id)
        .filter(id => id);

    const url = theme
        ? `${api_link}random_articles?theme=${encodeURIComponent(theme)}&count=${BLOCK_BATCH_COUNT}${exceptArticles.length ? `&except_articles=${exceptArticles.join(',')}` : ''}`
        : `${api_link}random_articles?count=${BLOCK_BATCH_COUNT}${exceptArticles.length ? `&except_articles=${exceptArticles.join(',')}` : ''}`;

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Не удалось загрузить статьи");
        const newArticles = await res.json();

        popularArticles = [...popularArticles, ...newArticles];

        renderNextArticlesBlocks(container, popularArticles);
    } catch (err) {
        console.error("Ошибка при загрузке статей:", err);
        container.innerHTML = "<p>Ошибка загрузки статей</p>";
    } finally {
        // Убираем "Загрузка..." если он был
        const loadingText = container.querySelector("p");
        if (loadingText) loadingText.remove();
    }
}

function renderNextArticlesBlocks(container, targetArticles) {
    const start = renderedIndex;
    const end = targetArticles.length;

    // Удаляем старую кнопку
    const oldButton = container.querySelector("#load-more");
    if (oldButton) oldButton.remove();

    // Добавляем статьи подряд
    for (let i = start; i < end; i++) {
        const col = document.createElement("div");
        col.className = "col-4 col-6-medium col-12-small";

        let isAd = Math.random() > 0.8;
        const block = createStandardArticleBlock(targetArticles[i], isAd);

        col.appendChild(block);
        container.appendChild(col);
    }

    renderedIndex = end;

    // Вставляем кнопку "Загрузить ещё"
    insertLoadMoreButton(container, () => {
        loadPopularArticles();
    });
}

function insertLoadMoreButton(container, onClick) {
    const wrapper = document.createElement("div");
    wrapper.className = "col-12";
    wrapper.style.textAlign = "center";
    const btn = document.createElement("a");
    btn.id = "load-more";
    btn.className = "button icon solid fa-file";
    btn.textContent = "Загрузить ещё";
    btn.href = "#";
    btn.addEventListener("click", e => { e.preventDefault(); onClick(); });
    wrapper.appendChild(btn);
    container.appendChild(wrapper);
}


// === Загрузка свежих ===
async function loadRecentArticles() {
    const container = document.querySelector("#features .row.aln-center");
    if (!container) return;

    const params = new URLSearchParams(window.location.search);

    // Получаем ID уже отображенных статей
    const renderedArticles = container.querySelectorAll('.article-block');
    const exceptArticles = Array.from(renderedArticles)
        .map(article => article.dataset.id)
        .filter(id => id);

    const url = `${api_link}recent_articles?count=${BLOCK_BATCH_COUNT}${exceptArticles.length ? `&except_articles=${exceptArticles.join(',')}` : ''}`;

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Не удалось загрузить статьи");
        const newArticles = await res.json();

        popularArticles = [...popularArticles, ...newArticles];

        renderNextArticlesBlocks(container, popularArticles);
    } catch (err) {
        console.error("Ошибка при загрузке статей:", err);
        container.innerHTML = "<p>Ошибка загрузки статей</p>";
    } finally {
        const loadingText = container.querySelector("p");
        if (loadingText) loadingText.remove();
    }
}


// === Загрузка свежих (кратко) ===
async function loadRecentArticlesSidebar() {
  const container = document.getElementById("recent-articles");
  if (!container) return;
  try {
    const res = await fetch(`${api_link}recent_articles`);
    if (!res.ok) throw new Error("Ошибка загрузки");
    const articles = await res.json();
    container.innerHTML = "";
    articles.forEach(a => {
      const block = createStandardArticleBlock(a, false);
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
    const res = await fetch(`${api_link}look_for_articles?q=${encodeURIComponent(query)}`);
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
        const block = createStandardArticleBlock(articles[j], false);
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
    const container = document.getElementById("article-container");
    if (!container) return;

    const slug = getSlugFromPath();
    if (!slug) return;

    try {
        const itemsPerRow = getArticlesPerRow();
        const res = await fetch(`${api_link}similar_articles?slug=${encodeURIComponent(slug)}&limit=${3*itemsPerRow}`);
        if (!res.ok) throw new Error("Не удалось загрузить похожие статьи");

        const newArticles = await res.json();

        // Добавляем новые статьи к уже загруженным
        similarArticles = [...similarArticles, ...newArticles];

        renderSimilarBatch();
    } catch (err) {
        console.warn("Ошибка загрузки похожих статей:", err);
    } finally {
      const paragraphs = Array.from(container.querySelectorAll(":scope > p"));
      
      paragraphs.forEach(p => {
          // Если <p> не внутри блоков с классами статей
          if (!p.closest(".posts") && !p.closest(".article-with-ad")) {
              p.remove();
          }
      });
    }
}

function renderSimilarBatch() {
    const container = document.getElementById("article-container");
    if (!container) return;

    const itemsPerRow = getArticlesPerRow();
    const total = similarArticles.length;
    const start = similarRenderedIndex;
    const end = Math.min(total, start + (itemsPerRow * BLOCK_BATCH_COUNT));

    // Удаляем старую кнопку "Загрузить ещё", если она есть
    const oldButton = document.getElementById("load-more");
    if (oldButton) oldButton.remove();

    // Отрисовываем новые статьи
    for (let i = start; i < end; i += itemsPerRow) {
        const row = document.createElement("div");
        row.className = "posts";
        for (let j = i; j < i + itemsPerRow && j < end; j++) {
            const isAd = Math.random() > 0.8;
            const block = createStandardArticleBlock(similarArticles[j], isAd);
            row.appendChild(block);
        }
        container.appendChild(row);
    }

    similarRenderedIndex = end;

    // Вставляем кнопку "Загрузить ещё"
    insertLoadMoreButton(container, loadSimilarArticles);
}


// === Загрузка тем ===
async function loadThemes() {
  try {
    const res = await fetch(`${api_link}themes`);
    if (!res.ok) throw new Error("Темы не получены");
    const themes = await res.json();

    // look for <ul> inside menu
    const submenu = document.querySelector("#menu-items > li:nth-child(2) ul");
    if (!submenu) throw new Error("Подменю для разделов не найдено");

    themes.forEach(t => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = `index.html?theme=${encodeURIComponent(t.slug)}`;
      a.textContent = t.name;
      li.appendChild(a);
      submenu.appendChild(li);
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
  //loadRecentArticlesSidebar();

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
      const newArticles = await fetchMoreArticles();
      renderArticles(newArticles);

      if (!hasMoreArticles()) {
        loadMoreBtn.style.display = "none";
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
