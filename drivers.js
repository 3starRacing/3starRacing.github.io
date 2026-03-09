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
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M4 11a8 8 0 0 1 16 0v6.5a3.5 3.5 0 0 1-3.5 3.5h-9A3.5 3.5 0 0 1 4 17.5V11z" fill="currentColor" fill-opacity="0.05" />
        <path d="M4 11h16v1.5a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-1.5z" fill="currentColor" fill-opacity="0.2" />
        <path d="M12 3v4" />
        <path d="M10 17.2h4" />
        <path d="M11 20.5h2" />
        <circle cx="4" cy="11.5" r="1.5" stroke="none" fill="currentColor" />
        <circle cx="20" cy="11.5" r="1.5" stroke="none" fill="currentColor" />
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
