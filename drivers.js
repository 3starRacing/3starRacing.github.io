const DRIVERS = [
  {
    name: "Juraj Ďurica",
    avatar: "",
    flags: "SK,DE",
    badges: ["iRacing", "GT3"],
    simulator: "iRacing",
    classes: "GT3",
    achievements: "—",
    emailUser: "jdurica",
    emailDomain: "3star.racing"
  },
  {
    name: "MG",
    avatar: "images/avatars/mg.webp",
    flags: "SK,US",
    badges: ["ACC", "iRacing", "LMU", "GT3", "Nascar"],
    simulator: "ACC, iRacing, LMU",
    classes: "GT3, Nascar",
    achievements: "",
    emailUser: "mg",
    emailDomain: "3star.racing"
  },
  {
    name: "Martin Kravec",
    avatar: "",
    flags: "SK",
    badges: ["LMU", "LMGT3", "HY", "LMP2", "LMP3"],
    simulator: "LMU",
    classes: "LMGT3, prototypes",
    achievements: "",
    emailUser: "martinkravec",
    emailDomain: "3star.racing"
  },
  {
    name: "Martin Margecanský",
    avatar: "",
    flags: "SK",
    badges: ["iRacing", "GT3", "LMU"],
    simulator: "LMU, iRacing",
    classes: "GT3",
    achievements: "",
    emailUser: "mm",
    emailDomain: "3star.racing"
  },
  {
    name: "Koudy Stříbrský",
    avatar: "",
    flags: "CZ",
    badges: ["GT7", "GT3"],
    simulator: "GT7, ACC",
    classes: "GT3",
    achievements: "",
    emailUser: "",
    emailDomain: ""
  }
];

/**
 * Obfuscates an email for display.
 * The text is rendered RTL so bots scraping the DOM get reversed characters,
 * but a nested LTR span makes it visually correct for humans.
 * The mailto: href is assembled from parts so it never appears as a plain string.
 */
function obfuscatedEmailHTML(user, domain) {
  const addr = user + '\u0040' + domain;           // build at runtime
  const reversed = addr.split('').reverse().join(''); // reverse for the RTL trick
  return `<a class="driver-email-link" href="#"
             data-u="${user}" data-d="${domain}"
             onclick="this.href='mai'+'lto:'+this.dataset.u+'@'+this.dataset.d;">
            <span class="email-obf">${reversed}</span>
          </a>`;
}

function renderDrivers() {
  const container = document.getElementById('driver-grid');
  if (!container) return;

  container.innerHTML = DRIVERS.map(driver => `
<article class="driver-card">
  <div class="driver-top">
    <div class="driver-avatar" aria-hidden="true">
      ${driver.avatar ?
      `<img src="${driver.avatar}" alt="${driver.name}" />` :
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M4 11a8 8 0 0 1 16 0v6.5a3.5 3.5 0 0 1-3.5 3.5h-9A3.5 3.5 0 0 1 4 17.5V11z" fill="currentColor" fill-opacity="0.05" />
          <path d="M4 11h16v1.5a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-1.5z" fill="currentColor" fill-opacity="0.2" />
          <path d="M12 3v4" />
          <path d="M10 17.2h4" />
          <path d="M11 20.5h2" />
          <circle cx="4" cy="11.5" r="1.5" stroke="none" fill="currentColor" />
          <circle cx="20" cy="11.5" r="1.5" stroke="none" fill="currentColor" />
        </svg>`
    }
    </div>
    <div>
      <div class="driver-name-wrap">
        <h3 class="driver-name">${driver.name}</h3>
        ${driver.flags ? `<div class="driver-flags">
          ${driver.flags.split(',').map(f => `<img src="flags/${f.trim().toLowerCase()}.svg" alt="${f.trim()}" title="${f.trim()}" class="driver-flag" />`).join('')}
        </div>` : ''}
      </div>
      <div class="driver-badges">
        ${driver.badges.map(badge => `<span class="badge-pill">${badge}</span>`).join('')}
      </div>
    </div>
  </div>

  <div class="driver-lines">
    <div class="driver-line">
      <span class="driver-label" data-i18n="drivers_label_sim">Simulátor</span>
      <span class="driver-value">${driver.simulator}</span>
    </div>
    <div class="driver-line">
      <span class="driver-label" data-i18n="drivers_label_classes">Triedy</span>
      <span class="driver-value">${driver.classes}</span>
    </div>
    ${driver.achievements ? `<div class="driver-line">
      <span class="driver-label" data-i18n="drivers_label_achievements">Úspechy</span>
      <span class="driver-value">${driver.achievements}</span>
    </div>` : ''}
    ${driver.emailUser ? `<div class="driver-line">
      <span class="driver-label" data-i18n="drivers_label_email">E-mail</span>
      <span class="driver-value">${obfuscatedEmailHTML(driver.emailUser, driver.emailDomain)}</span>
    </div>` : ''}
  </div>
</article>
  `).join('');
}
