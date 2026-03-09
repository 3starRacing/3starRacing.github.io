const DRIVERS = [
  {
    name: "Juraj Durica",
    flags: "SK,DE",
    badges: ["iRacing", "GT3"],
    simulator: "iRacing",
    classes: "GT3",
    achievements: "—"
  },
  {
    name: "Martin Kravec",
    flags: "SK",
    badges: ["LMU", "LMGT3", "HY/LMP2/LMP3"],
    simulator: "LMU",
    classes: "LMGT3, HY, LMP2, LMP3",
    achievements: "—"
  },
  {
    name: "",
    flags: "",
    badges: ["Le Mans Ultimate", "LMGT3"],
    simulator: "Le Mans Ultimate",
    classes: "LMGT3",
    achievements: "—"
  },
  {
    name: "Jazdec #4",
    flags: "",
    badges: ["ACC", "GT4"],
    simulator: "ACC",
    classes: "GT4",
    achievements: "—"
  }
];

function renderDrivers() {
  const container = document.getElementById('driver-grid');
  if (!container) return;

  container.innerHTML = DRIVERS.map(driver => `
<article class="driver-card">
  <div class="driver-top">
    <div class="driver-avatar" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M7.5 10.2c.3-3.6 3-6.2 6.7-6.2 3.8 0 6.5 2.6 6.8 6.2.1 1.2.1 2.5 0 3.8-.1 1.1-.9 1.9-2 1.9H9.5c-1.1 0-1.9-.8-2-1.9-.1-1.3-.1-2.6 0-3.8Z" stroke="currentColor" stroke-width="1.6" />
        <path d="M9 12.4h6.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
        <path d="M6.6 16.9c-1.8.6-3.1 2-3.1 3.7V22h17v-1.4c0-1.7-1.3-3.1-3.1-3.7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
      </svg>
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
    <div class="driver-line">
      <span class="driver-label" data-i18n="drivers_label_achievements">Úspechy</span>
      <span class="driver-value">${driver.achievements}</span>
    </div>
  </div>
</article>
  `).join('');
}
