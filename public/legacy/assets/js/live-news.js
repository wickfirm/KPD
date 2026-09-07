(function () {
  const keywordLabels = [
    "Kasumigaseki",
    "Kasumigaseki Dubai",
    "Kasumigaseki Capital",
    "Kasumigaseki Restaurant",
    "SevenXSeven",
    "FAV",
    "Fork and Knife Hotel"
  ];

  const matchTerms = [
    "kasumigaseki",
    "kasumigaseki dubai",
    "kasumigaseki capital",
    "kasumigaseki restaurant",
    "sevenxseven",
    "seven x seven",
    "fav hotel",
    "fork and knife hotel",
    "fork & knife hotel"
  ];

  const googleQuery = {
    label: "Kasumigaseki",
    query: '"Kasumigaseki" OR "Kasumigaseki Dubai" OR "Kasumigaseki Capital" OR "Kasumigaseki Restaurant" OR "SevenXSeven" OR "Seven X Seven" OR "FAV Hotel" OR "Fork and Knife Hotel" OR "Fork & Knife Hotel"'
  };

  const gdeltQuery = [
    '"Kasumigaseki"',
    '"Kasumigaseki Dubai"',
    '"Kasumigaseki Capital"',
    '"Kasumigaseki Restaurant"',
    '"SevenXSeven"',
    '"Seven X Seven"',
    '"FAV Hotel"',
    '"Fork and Knife Hotel"',
    '"Fork & Knife Hotel"'
  ].join(" OR ");

  const refreshMs = 30 * 60 * 1000;
  const rssFeedUrl = "https://rss.app/feeds/v1.1/thmGctlXpPDN9hCP.json";
  const cacheUrl = "assets/data/live-news-cache.json";
  const fallbackImages = [
    "assets/images/library/office-buildings-property-real-estate-skyscrape-2026-03-17-04-25-11-utc.jpg",
    "assets/images/library/bottom-up-view-of-modern-office-building-in-hong-k-2026-01-11-09-09-49-utc.jpg",
    "assets/images/library/the-office-building-2026-03-24-04-30-30-utc.jpg",
    "assets/images/library/modern-financial-office-buildings-2026-03-18-04-41-23-utc.jpg",
    "assets/images/library/dubai-marina-and-tourist-boat-at-sunset-2026-03-11-04-23-26-utc.jpg",
    "assets/images/library/tall-office-towers-commercial-real-estate-blue-sky-2026-03-24-11-16-05-utc.jpg",
    "assets/images/library/commercial-district-in-tokyo-2026-03-24-22-42-22-utc.jpg",
    "assets/images/library/modern-office-glasses-buildings-cityscape-under-bl-2026-03-10-02-05-10-utc.jpg",
    "assets/images/library/luxury-downtown-of-dubai-2026-03-19-09-24-48-utc.jpg"
  ];
  let loadingPromise = null;

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/&amp;/g, "&")
      .replace(/[^\p{L}\p{N}&]+/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function textFromHtml(html) {
    const doc = new DOMParser().parseFromString(String(html || ""), "text/html");
    return doc.body.textContent.replace(/\s+/g, " ").trim();
  }

  function buildGoogleFeedUrl(query) {
    const params = new URLSearchParams({
      q: query,
      hl: "en-US",
      gl: "US",
      ceid: "US:en"
    });
    return `https://news.google.com/rss/search?${params.toString()}`;
  }

  function buildGdeltUrl() {
    const params = new URLSearchParams({
      query: gdeltQuery,
      mode: "ArtList",
      format: "json",
      maxrecords: "75",
      sort: "DateDesc"
    });
    return `https://api.gdeltproject.org/api/v2/doc/doc?${params.toString()}`;
  }

  async function fetchWithTimeout(url, options, timeoutMs) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs || 12000);
    try {
      return await fetch(url, {
        ...(options || {}),
        signal: controller.signal
      });
    } finally {
      window.clearTimeout(timer);
    }
  }

  async function fetchText(url) {
    const response = await fetchWithTimeout(url, { cache: "no-store" }, 12000);
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    return response.text();
  }

  async function fetchTextViaProxy(url) {
    const endpoint = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    return fetchText(endpoint);
  }

  async function fetchJsonDirectOrProxy(url) {
    try {
      const response = await fetchWithTimeout(url, { cache: "no-store" }, 8000);
      if (!response.ok) throw new Error(`Request failed: ${response.status}`);
      return response.json();
    } catch (error) {
      const text = await fetchTextViaProxy(url);
      return JSON.parse(text);
    }
  }

  async function loadCachedItems() {
    const response = await fetchWithTimeout(cacheUrl, { cache: "no-store" }, 2500);
    if (!response.ok) throw new Error(`Cache request failed: ${response.status}`);
    const items = await response.json();
    return dedupeAndSort(items.map((item) => {
      const article = {
        title: item.title || "",
        source: item.source || "External source",
        snippet: item.snippet || "External coverage matching the selected Kasumigaseki keyword set.",
        link: item.link || "",
        pubDate: item.pubDate || "",
        timestamp: Date.parse(item.pubDate || "") || 0,
        keyword: item.keyword || "Kasumigaseki",
        image: item.image || ""
      };
      article.keyword = matchedKeywordFor(article);
      return article;
    }));
  }

  function cleanTitle(title, source) {
    let clean = String(title || "").replace(/\s+/g, " ").trim();
    if (source) {
      clean = clean.replace(new RegExp(`\\s+-\\s+${source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"), "");
    }
    return clean;
  }

  function cleanSnippet(description, title, source) {
    let snippet = textFromHtml(description);
    if (title) snippet = snippet.replace(title, "");
    if (source) snippet = snippet.replace(source, "");
    snippet = snippet.replace(/\s+/g, " ").replace(/^[-\s]+/, "").trim();
    return snippet || "External coverage matching the selected Kasumigaseki keyword set.";
  }

  function parseGdeltDate(value) {
    const text = String(value || "");
    const match = text.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/);
    if (!match) return text;
    return `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}Z`;
  }

  function matchedKeywordFor(item) {
    const haystack = normalize(`${item.title} ${item.snippet} ${item.source} ${item.keyword}`);
    return keywordLabels.find((keyword) => haystack.includes(normalize(keyword))) || item.keyword || "Kasumigaseki";
  }

  function isRelevant(item) {
    const haystack = normalize(`${item.title} ${item.snippet} ${item.source} ${item.keyword}`);
    return matchTerms.some((term) => haystack.includes(normalize(term)));
  }

  function parseGoogleFeed(xmlText, config) {
    const xml = new DOMParser().parseFromString(xmlText, "text/xml");
    if (xml.querySelector("parsererror")) return [];

    return Array.from(xml.querySelectorAll("item")).map((item) => {
      const sourceNode = item.querySelector("source");
      const source = sourceNode ? sourceNode.textContent.trim() : "External source";
      const rawTitle = item.querySelector("title") ? item.querySelector("title").textContent : "";
      const title = cleanTitle(rawTitle, source);
      const description = item.querySelector("description") ? item.querySelector("description").textContent : "";
      const link = item.querySelector("link") ? item.querySelector("link").textContent.trim() : "";
      const pubDate = item.querySelector("pubDate") ? item.querySelector("pubDate").textContent.trim() : "";
      const snippet = cleanSnippet(description, title, source);
      const media = item.querySelector("media\\:content, content");
      const enclosure = item.querySelector("enclosure");
      const image = (media && media.getAttribute("url")) || (enclosure && enclosure.getAttribute("url")) || "";

      const article = {
        title,
        source,
        snippet,
        link,
        pubDate,
        timestamp: Date.parse(pubDate) || 0,
        keyword: config.label,
        image
      };
      article.keyword = matchedKeywordFor(article);
      return article;
    });
  }

  function sourceFromUrl(url) {
    try {
      const hostname = new URL(url).hostname.replace(/^www\./, "");
      return hostname
        .split(".")
        .slice(0, -1)
        .join(".")
        .replace(/[-_]+/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase()) || "External source";
    } catch (error) {
      return "External source";
    }
  }

  function imageFromHtml(html) {
    const doc = new DOMParser().parseFromString(String(html || ""), "text/html");
    const image = doc.querySelector("img");
    return image ? image.getAttribute("src") || "" : "";
  }

  function parseRssAppItems(data) {
    return (data.items || []).map((entry) => {
      const source = (entry.authors && entry.authors[0] && entry.authors[0].name) || sourceFromUrl(entry.url);
      const pubDate = entry.date_published || entry.date_modified || "";
      const snippet = cleanSnippet(entry.content_text || entry.content_html || entry.summary || "", entry.title, source);
      const image = entry.image || imageFromHtml(entry.content_html) || ((entry.attachments || []).find((attachment) => attachment.url)?.url || "");
      const article = {
        title: cleanTitle(entry.title, source),
        source,
        snippet,
        link: entry.url || entry.external_url || "",
        pubDate,
        timestamp: Date.parse(pubDate) || 0,
        keyword: "Kasumigaseki",
        image
      };
      article.keyword = matchedKeywordFor(article);
      return article;
    });
  }

  function parseGdeltArticles(data) {
    return (data.articles || []).map((article) => {
      const pubDate = parseGdeltDate(article.seendate);
      const item = {
        title: cleanTitle(article.title, article.domain),
        source: article.domain || "External source",
        snippet: article.sourcecountry ? `Coverage from ${article.sourcecountry}.` : "External coverage matching the selected Kasumigaseki keyword set.",
        link: article.url,
        pubDate,
        timestamp: Date.parse(pubDate) || 0,
        keyword: "Kasumigaseki",
        image: article.socialimage || ""
      };
      item.keyword = matchedKeywordFor(item);
      return item;
    });
  }

  function dedupeAndSort(items) {
    const seen = new Set();
    return items
      .filter((item) => item.title && item.link && isRelevant(item))
      .filter((item) => {
        const key = normalize(item.title);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  async function loadGdeltItems() {
    const data = await fetchJsonDirectOrProxy(buildGdeltUrl());
    return parseGdeltArticles(data);
  }

  async function loadGoogleItems() {
    const xml = await fetchTextViaProxy(buildGoogleFeedUrl(googleQuery.query));
    return parseGoogleFeed(xml, googleQuery);
  }

  async function loadRemoteItems() {
    if (loadingPromise) return loadingPromise;

    loadingPromise = fetchJsonDirectOrProxy(rssFeedUrl)
      .then((data) => dedupeAndSort(parseRssAppItems(data)))
      .finally(() => {
        loadingPromise = null;
      });

    return loadingPromise;
  }

  function formatDate(pubDate) {
    const date = new Date(pubDate);
    if (Number.isNaN(date.getTime())) return "Live";
    return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date);
  }

  function setStatus(section, text) {
    const status = section.querySelector("[data-live-news-status]");
    if (status) status.textContent = text;
  }

  function getFeedRoot(section) {
    if (section.matches("[data-live-news-feed]")) return section;
    return section.querySelector("[data-live-news-feed]");
  }

  function renderLoading(section) {
    const root = getFeedRoot(section);
    if (!root || section.hasAttribute("data-live-news-preserve-loading")) return;
    root.innerHTML = "";
    for (let index = 0; index < 3; index += 1) {
      const card = document.createElement("article");
      card.className = "news-card-item kpd-news-card live-news-card live-news-card--loading";
      card.innerHTML = '<div class="kpd-card-content"><span></span><h3></h3><p></p><i></i></div>';
      root.appendChild(card);
    }
  }

  function fallbackImageFor(item) {
    const explicitIndex = Number(item.fallbackIndex ?? item._renderIndex);
    if (Number.isFinite(explicitIndex)) {
      return fallbackImages[Math.abs(explicitIndex) % fallbackImages.length];
    }
    const seed = String(item.title || item.link || item.source || "kpd");
    let hash = 0;
    for (let index = 0; index < seed.length; index += 1) {
      hash = (hash * 31 + seed.charCodeAt(index)) % fallbackImages.length;
    }
    return fallbackImages[Math.abs(hash) % fallbackImages.length];
  }

  function imageNode(item) {
    const image = document.createElement("img");
    image.src = item.image || fallbackImageFor(item);
    image.alt = item.title;
    image.loading = "lazy";
    return image;
  }

  function appendArticleImage(card, item) {
    const image = imageNode(item);
    if (!image) return;
    image.addEventListener("error", () => {
      if (image.dataset.fallbackApplied === "true") {
        image.remove();
        card.classList.add("live-news-card--no-image");
        return;
      }
      image.dataset.fallbackApplied = "true";
      image.src = fallbackImageFor(item);
    });
    card.appendChild(image);
  }

  function createDefaultCard(item) {
    const card = document.createElement("a");
    card.className = "news-card-item kpd-news-card live-news-card";
    card.href = item.link;
    card.target = "_blank";
    card.rel = "noopener noreferrer";

    appendArticleImage(card, item);

    const content = document.createElement("div");
    content.className = "kpd-card-content";

    const meta = document.createElement("span");
    meta.className = "kpd-card-date live-news-meta";
    meta.textContent = `${item.source} - ${formatDate(item.pubDate)}`;

    const title = document.createElement("h3");
    title.textContent = item.title;

    const text = document.createElement("p");
    text.textContent = item.snippet;

    const button = document.createElement("span");
    button.className = "btn-pill";
    button.textContent = "Read Original";

    content.append(meta, title, text, button);
    card.appendChild(content);
    return card;
  }

  function createHomeNewsCard(item) {
    const card = document.createElement("a");
    card.className = "news-card news-card-link live-news-card";
    card.href = item.link;
    card.target = "_blank";
    card.rel = "noopener noreferrer";

    appendArticleImage(card, item);

    const content = document.createElement("div");
    content.className = "news-card-body";
    content.innerHTML = "";

    const meta = document.createElement("p");
    meta.className = "small-kicker";
    meta.textContent = `${item.source} - ${formatDate(item.pubDate)}`;

    const title = document.createElement("h3");
    title.textContent = item.title;

    const text = document.createElement("p");
    text.textContent = item.snippet;

    content.append(meta, title, text);
    card.appendChild(content);
    return card;
  }

  function createFeatureCard(item) {
    const card = document.createElement("a");
    card.className = "feature-card feature-card-link live-news-card";
    card.href = item.link;
    card.target = "_blank";
    card.rel = "noopener noreferrer";

    appendArticleImage(card, item);

    const content = document.createElement("div");
    content.className = "feature-card-body";

    const meta = document.createElement("p");
    meta.className = "small-kicker";
    meta.textContent = `${item.source} - ${formatDate(item.pubDate)}`;

    const title = document.createElement("h3");
    title.textContent = item.title;

    const text = document.createElement("p");
    text.textContent = item.snippet;

    content.append(meta, title, text);
    card.appendChild(content);
    return card;
  }

  function createCard(item, style) {
    if (style === "home") return createHomeNewsCard(item);
    if (style === "feature") return createFeatureCard(item);
    return createDefaultCard(item);
  }

  function renderSection(section, items) {
    const root = getFeedRoot(section);
    const empty = section.querySelector("[data-live-news-empty]");
    if (!root) return;

    const style = root.getAttribute("data-live-news-style") || section.getAttribute("data-live-news-style") || "default";
    const limit = Number(root.getAttribute("data-live-news-limit")) || 9;
    const visibleItems = items.slice(0, limit);

    if (!visibleItems.length) {
      if (!section.hasAttribute("data-live-news-preserve-loading")) root.innerHTML = "";
      if (empty) empty.hidden = false;
      setStatus(section, "No matching live articles found right now.");
      return;
    }

    if (empty) empty.hidden = true;
    root.innerHTML = "";
    visibleItems.forEach((item, index) => root.appendChild(createCard({ ...item, _renderIndex: index }, style)));

    const updated = new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      month: "short",
      day: "numeric"
    }).format(new Date());
    setStatus(section, `Live feed updated ${updated}. Auto-refreshes every 30 minutes.`);
  }

  function renderFeature(items) {
    const feature = document.querySelector("[data-live-news-feature]");
    if (!feature || !items.length) return;

    const item = items[0];
    const date = feature.querySelector("[data-live-feature-date]");
    const title = feature.querySelector("[data-live-feature-title]");
    const summary = feature.querySelector("[data-live-feature-summary]");
    const secondary = feature.querySelector("[data-live-feature-secondary]");
    const link = feature.querySelector("[data-live-feature-link]");
    const image = feature.querySelector("[data-live-feature-image]");
    const media = feature.querySelector(".news-feature-media");

    if (date) {
      date.textContent = `${item.source} - ${formatDate(item.pubDate)}`;
      date.removeAttribute("datetime");
    }
    if (title) title.textContent = item.title;
    if (summary) summary.textContent = item.snippet;
    if (secondary) secondary.hidden = true;
    if (link) {
      link.href = item.link;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Read Original";
    }
    if (image) {
      image.onerror = () => {
        if (image.dataset.fallbackApplied === "true") {
          if (media) media.hidden = true;
          return;
        }
        image.dataset.fallbackApplied = "true";
        image.src = fallbackImageFor(item);
      };
      image.src = item.image || fallbackImageFor(item);
      image.alt = item.title;
      if (media) media.hidden = false;
    } else if (media) {
      media.hidden = true;
    }
  }

  async function refresh(sectionList) {
    sectionList.forEach((section) => {
      setStatus(section, "Loading live articles from the internet...");
    });

    let renderedFallback = false;

    try {
      const cachedItems = await loadCachedItems();
      if (cachedItems.length) {
        renderedFallback = true;
        renderFeature(cachedItems);
        sectionList.forEach((section) => renderSection(section, cachedItems));
        sectionList.forEach((section) => setStatus(section, "Showing latest saved articles. Checking live feed..."));
      }
    } catch (error) {
      sectionList.forEach((section) => renderLoading(section));
    }

    try {
      const items = await loadRemoteItems();
      if (items.length) {
        renderFeature(items);
        sectionList.forEach((section) => renderSection(section, items));
      } else if (!renderedFallback) {
        sectionList.forEach((section) => {
          const empty = section.querySelector("[data-live-news-empty]");
          const root = getFeedRoot(section);
          if (root && !section.hasAttribute("data-live-news-preserve-loading")) root.innerHTML = "";
          if (empty) empty.hidden = false;
          setStatus(section, "No matching live articles found right now.");
        });
      } else {
        sectionList.forEach((section) => setStatus(section, "Showing latest saved articles. Live feed has no newer matches."));
      }
    } catch (error) {
      sectionList.forEach((section) => {
        const empty = section.querySelector("[data-live-news-empty]");
        const root = getFeedRoot(section);
        if (!renderedFallback) {
          if (root && !section.hasAttribute("data-live-news-preserve-loading")) root.innerHTML = "";
          if (empty) empty.hidden = false;
          setStatus(section, "Live feed unavailable. Try refreshing in a moment.");
        } else {
          if (empty) empty.hidden = true;
          setStatus(section, "Showing latest saved articles. Live feed refresh timed out.");
        }
      });
    }
  }

  function initLiveNews() {
    const sections = Array.from(document.querySelectorAll("[data-live-news-section]"));
    const feature = document.querySelector("[data-live-news-feature]");
    if (!sections.length && !feature) return;

    sections.forEach((section) => {
      section.querySelectorAll("[data-live-news-refresh]").forEach((button) => {
        button.addEventListener("click", () => refresh(sections));
      });
    });

    refresh(sections);
    window.setInterval(() => refresh(sections), refreshMs);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLiveNews);
  } else {
    initLiveNews();
  }
})();
