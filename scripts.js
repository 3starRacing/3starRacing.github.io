var langToHtml = { sk: "sk", cz: "cs", en: "en" };

function setLanguage(lang) {
  var dict = translations[lang] || translations.sk;
  document.documentElement.lang = langToHtml[lang] || "sk";

  // Titulek v prohlížeči
  document.title = (lang === "en")
    ? "3Star Racing – Simracing team"
    : "3Star Racing – Simracing tím SK/CZ";

  var elements = document.querySelectorAll("[data-i18n]");
  for (var i = 0; i < elements.length; i++) {
    var el = elements[i];
    var key = el.getAttribute("data-i18n");
    if (dict[key]) {
      el.textContent = dict[key];
    }
  }

  var buttons = document.querySelectorAll(".lang-btn");
  var langMap = { "SK": "sk", "CZ": "cz", "EN": "en" };
  for (var j = 0; j < buttons.length; j++) {
    var btn = buttons[j];
    btn.classList.toggle("active", langMap[btn.textContent.trim()] === lang);
  }

  if (typeof renderNews === "function" && document.getElementById("news-container")) {
    renderNews(); // re-render news in selected language
  }
  if (typeof renderGalleryTabs === "function" && document.getElementById("gallery-tabs")) {
    renderGalleryTabs();
    if (typeof activeAlbum !== "undefined" && activeAlbum) renderGalleryGrid();
  }
}

// --- NEWS LOGIC ---
var newsData = [];
var currentNewsPage = 1;
var newsPerPage = 5;
// CSV format: Date | Title SK | Text SK | Title CZ | Text CZ | Title EN | Text EN
var newsUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQwSVDg_a90Rq0_77bTxS3W2AWmDbudWv_7o9I0SOzAqnoG3wRKj1b5Cl9zRpz3Jd5C_lKoU2olA2tr/pub?gid=0&single=true&output=csv";

// use open-source CORS proxy to avoid 'origin null' problem when testing directly from disk 
//newsUrl = "https://corsproxy.io/?" + encodeURIComponent(newsUrl);

function loadNews() {
  var container = document.getElementById("news-container");
  if (!container) return; // News section optional (not on all pages)

  fetch(newsUrl)
    .then(function (response) {
      if (!response.ok) throw new Error("Network error");
      return response.text();
    })
    .then(function (csvText) {
      newsData = parseCSV(csvText);
      // Auto remove header if includes "date" in first cell
      if (newsData.length > 0 && newsData[0].length > 1 && newsData[0][0].toLowerCase().includes("date")) {
        newsData.shift();
      }
      currentNewsPage = 1;
      renderNews();
    })
    .catch(function (err) {
      if (container) container.innerHTML = '<p class="muted" data-i18n="news_error">Chyba pri načítaní noviniek.</p>';
      var lang = Object.keys(langToHtml).find(key => langToHtml[key] === document.documentElement.lang) || "sk";
      setLanguage(lang);
    });
}

function parseCSV(str) {
  var arr = [];
  var quote = false;
  for (var row = 0, col = 0, c = 0; c < str.length; c++) {
    var cc = str[c], nc = str[c + 1];
    arr[row] = arr[row] || [];
    arr[row][col] = arr[row][col] || '';
    if (cc == '"' && quote && nc == '"') { arr[row][col] += cc; ++c; continue; }
    if (cc == '"') { quote = !quote; continue; }
    if (cc == ',' && !quote) { ++col; continue; }
    if (cc == '\r' && nc == '\n' && !quote) { ++row; col = 0; ++c; continue; }
    if (cc == '\n' && !quote) { ++row; col = 0; continue; }
    if (cc == '\r' && !quote) { ++row; col = 0; continue; }
    arr[row][col] += cc;
  }
  return arr.filter(function (r) { return r.length > 1 || (r.length === 1 && r[0].trim() !== ""); });
}

function renderNews() {
  var container = document.getElementById("news-container");
  var pagination = document.getElementById("news-pagination");
  if (!container) return;

  container.innerHTML = "";

  if (newsData.length === 0) {
    container.innerHTML = '<p class="muted" data-i18n="news_loading">Načítavam...</p>';
    pagination.style.display = "none";
    return;
  }

  var totalPages = Math.ceil(newsData.length / newsPerPage);
  var start = (currentNewsPage - 1) * newsPerPage;
  var end = start + newsPerPage;
  var pageNews = newsData.slice(start, end);

  // Decide column indexes based on current language
  var htmlLang = document.documentElement.lang;
  var titleIdx = 1, textIdx = 2; // SK default
  if (htmlLang === "cs") {
    titleIdx = 3; textIdx = 4;
  } else if (htmlLang === "en") {
    titleIdx = 5; textIdx = 6;
  }

  pageNews.forEach(function (newsRow) {
    var date = newsRow[0] || "";
    var title = newsRow[titleIdx] || newsRow[1] || ""; // fallback to SK if empty
    var text = newsRow[textIdx] || newsRow[2] || ""; // fallback to SK if empty

    // ak nie sú žiadne data vo vybranej jazykovej bunke (a náhodou ani v SK, pre istotu) nedávame prazdnu
    if (!title && !text) return;

    var card = document.createElement("div");
    card.className = "news-card";

    var headerDiv = document.createElement("div");
    headerDiv.className = "news-header";

    if (title) {
      var titleEl = document.createElement("h3");
      titleEl.className = "news-title";
      titleEl.textContent = title;
      headerDiv.appendChild(titleEl);
    }

    if (date) {
      var dateEl = document.createElement("span");
      dateEl.className = "news-date";
      dateEl.textContent = date;
      headerDiv.appendChild(dateEl);
    }

    card.appendChild(headerDiv);

    if (text) {
      var textEl = document.createElement("p");
      textEl.className = "news-body";
      // Make URLs active and preserve line breaks
      var formattedText = text.replace(/((http|https):\/\/[^\s]+)/g, '<a href="$1" target="_blank" style="color:var(--accent)">$1</a>')
        .replace(/\n/g, "<br>");
      textEl.innerHTML = formattedText;
      card.appendChild(textEl);
    }

    container.appendChild(card);
  });

  if (totalPages > 1) {
    pagination.style.display = "flex";
    pagination.style.gap = "0.5rem";
    pagination.style.marginTop = "1rem";
    document.getElementById("btn-prev-news").disabled = currentNewsPage === 1;
    document.getElementById("btn-next-news").disabled = currentNewsPage === totalPages;
    document.getElementById("btn-prev-news").style.opacity = currentNewsPage === 1 ? '0.5' : '1';
    document.getElementById("btn-next-news").style.opacity = currentNewsPage === totalPages ? '0.5' : '1';

    var sep = (htmlLang === "en") ? "of" : "z";
    document.getElementById("news-page-indicator").textContent = currentNewsPage + " " + sep + " " + totalPages;
  } else {
    pagination.style.display = "none";
  }
}

function changeNewsPage(dir) {
  var totalPages = Math.ceil(newsData.length / newsPerPage);
  currentNewsPage += dir;
  if (currentNewsPage < 1) currentNewsPage = 1;
  if (currentNewsPage > totalPages) currentNewsPage = totalPages;
  renderNews();
}

// --- SCROLL REVEAL ---
function initScrollReveal() {
  var reveals = document.querySelectorAll('.reveal');
  if (!reveals.length || !('IntersectionObserver' in window)) {
    // Fallback: show all immediately
    for (var i = 0; i < reveals.length; i++) reveals[i].classList.add('visible');
    return;
  }
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  reveals.forEach(function (el) { observer.observe(el); });
}

// --- HERO PARALLAX ---
function initHeroParallax() {
  var heroBg = document.querySelector('.hero-bg');
  if (!heroBg) return;
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(function () {
        var scrolled = window.pageYOffset;
        if (scrolled < window.innerHeight) {
          heroBg.style.transform = 'translateY(' + (scrolled * 0.35) + 'px)';
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

// --- NAV OVERFLOW MENU ---
// Nav links visibility is controlled by CSS breakpoints in style.css (.nav-links .nav-link:nth-child(n+X)).
// This JS only builds the overflow dropdown from CSS-hidden links and handles the toggle button.
function initPriorityNav() {
  var navLinks = document.querySelector('.nav-links');
  var toggle = document.querySelector('.nav-toggle');
  var overflow = document.getElementById('nav-overflow');
  if (!navLinks || !toggle || !overflow) return;

  var allLinks = Array.from(navLinks.querySelectorAll('.nav-link'));

  function update() {
    overflow.innerHTML = '';
    toggle.classList.remove('visible', 'active');
    overflow.classList.remove('open');

    // Read which links CSS has hidden at the current breakpoint
    var hiddenLinks = allLinks.filter(function (link) {
      return window.getComputedStyle(link).display === 'none';
    });

    hiddenLinks.forEach(function (link) {
      var a = document.createElement('a');
      a.href = link.getAttribute('href');
      a.className = 'nav-overflow-link';
      a.textContent = link.textContent.trim();
      if (link.hasAttribute('data-i18n')) {
        a.setAttribute('data-i18n', link.getAttribute('data-i18n'));
      }
      a.addEventListener('click', function () {
        overflow.classList.remove('open');
        toggle.classList.remove('active');
      });
      overflow.appendChild(a);
    });

    if (hiddenLinks.length > 0) {
      toggle.classList.add('visible');
    }
  }

  // Toggle overflow menu
  toggle.addEventListener('click', function () {
    overflow.classList.toggle('open');
    toggle.classList.toggle('active');
  });

  // Close on outside click
  document.addEventListener('click', function (e) {
    if (!toggle.contains(e.target) && !overflow.contains(e.target)) {
      overflow.classList.remove('open');
      toggle.classList.remove('active');
    }
  });

  update();
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(update, 50);
  });

  // Rebuild overflow text after language change
  var origSetLang = window.setLanguage;
  window.setLanguage = function (lang) {
    origSetLang(lang);
    update();
  };
}

// --- WIDE PARALLAX (JS-driven background-position-y) ---
// Used for .parallax-break--wide where background-attachment:fixed would break no-repeat positioning.
// background-attachment stays scroll; JS shifts background-position-y to create parallax.
function initWideParallax() {
  var els = document.querySelectorAll('.parallax-break--wide');
  if (!els.length) return;
  var ticking = false;

  function update() {
    els.forEach(function (el) {
      var rect = el.getBoundingClientRect();
      var viewH = window.innerHeight;
      // progress: 0 = element just entered from bottom, 1 = element just left from top
      var progress = (viewH - rect.top) / (viewH + rect.height);
      progress = Math.max(0, Math.min(1, progress));
      // Map to background-position-y: 40% at entry → 60% at exit (slow drift = parallax feel)
      var posY = 0 + progress * 100;
      el.style.backgroundPositionY = posY + '%';
    });
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });

  update();
}

function fixNavScrollbar() {
  var navInner = document.querySelector('.nav-inner');
  if (!navInner) return;
  var basePadding = 24; // 1.5rem in px
  function adjust() {
    var scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    navInner.style.paddingRight = (basePadding + scrollbarWidth) + 'px';
  }
  //adjust();
  //window.addEventListener('resize', adjust);
}

function init() {
  if (typeof renderDrivers === 'function' && document.getElementById('driver-grid')) {
    renderDrivers();
  }
  loadNews();
  if (typeof loadGallery === 'function' && document.getElementById('gallery-grid')) {
    loadGallery();
  }
  setLanguage("sk");
  initScrollReveal();
  initHeroParallax();
  initWideParallax();
  initPriorityNav();
}

// inicializácia – po načítaní HTML
document.addEventListener("DOMContentLoaded", init);
