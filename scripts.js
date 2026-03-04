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
}

function init() {
  renderDrivers();
  setLanguage("sk");
}

// inicializácia – po načítaní HTML
document.addEventListener("DOMContentLoaded", init);
