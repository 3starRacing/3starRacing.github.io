// liveries.js — Password-gated Google Drive livery browser.
// Uses the same deployed Apps Script URL as gallery.js.

var LIVERIES_SESSION_KEY = "3star_liveries_session";
var liveriesSession = null;
var liveriesPath = [];
var liveriesDirectory = null;
var liveriesStatusKey = "";
var liveriesLoginStatusKey = "";

function initLiveries() {
  var entry = document.getElementById("liveries-entry");
  var form = document.getElementById("liveries-login-form");
  var close = document.getElementById("liveries-login-close");
  var logout = document.getElementById("liveries-logout");
  var dialog = document.getElementById("liveries-login-dialog");

  if (!entry || !form || !dialog) return;

  entry.addEventListener("click", openLiveriesAccess);
  form.addEventListener("submit", submitLiveriesLogin);
  if (close) close.addEventListener("click", closeLiveriesLogin);
  if (logout) logout.addEventListener("click", logoutLiveries);

  dialog.addEventListener("click", function (event) {
    if (event.target === dialog) closeLiveriesLogin();
  });
  document.addEventListener("keydown", handleLiveriesKeydown);

  liveriesSession = readLiveriesSession();
  if (liveriesSession) revealLiveriesSection(false);
}

function openLiveriesAccess() {
  liveriesSession = readLiveriesSession();
  if (liveriesSession) {
    revealLiveriesSection(true);
    return;
  }
  openLiveriesLogin();
}

function openLiveriesLogin(messageKey) {
  var dialog = document.getElementById("liveries-login-dialog");
  var input = document.getElementById("liveries-password");
  if (!dialog) return;

  liveriesLoginStatusKey = messageKey || "";
  renderLiveriesLoginStatus();
  dialog.hidden = false;
  document.body.style.overflow = "hidden";
  if (input) {
    input.value = "";
    window.setTimeout(function () { input.focus(); }, 0);
  }
}

function closeLiveriesLogin() {
  var dialog = document.getElementById("liveries-login-dialog");
  if (!dialog || dialog.hidden) return;
  dialog.hidden = true;
  document.body.style.overflow = "";
  var entry = document.getElementById("liveries-entry");
  if (entry) entry.focus();
}

function handleLiveriesKeydown(event) {
  var dialog = document.getElementById("liveries-login-dialog");
  if (event.key === "Escape" && dialog && !dialog.hidden) closeLiveriesLogin();
}

function submitLiveriesLogin(event) {
  event.preventDefault();
  var input = document.getElementById("liveries-password");
  var submit = document.getElementById("liveries-login-submit");
  var password = input ? input.value : "";

  liveriesLoginStatusKey = "liveries_loading";
  renderLiveriesLoginStatus();
  if (submit) submit.disabled = true;

  liveriesApiPost({ action: "liveriesLogin", password: password })
    .then(function (data) {
      if (data.error || !data.token || !data.expiresAt) {
        throw { authorization: data.code === "UNAUTHORIZED" };
      }

      liveriesSession = { token: data.token, expiresAt: Number(data.expiresAt) };
      writeLiveriesSession(liveriesSession);
      closeLiveriesLogin();
      revealLiveriesSection(true);
    })
    .catch(function (error) {
      liveriesLoginStatusKey = error && error.authorization
        ? "liveries_wrong_password"
        : "liveries_error";
      renderLiveriesLoginStatus();
      if (input) input.focus();
    })
    .then(function () {
      if (submit) submit.disabled = false;
    });
}

function revealLiveriesSection(shouldScroll) {
  var section = document.getElementById("liveries");
  var entry = document.getElementById("liveries-entry");
  if (!section) return;

  section.hidden = false;
  if (entry) entry.setAttribute("aria-expanded", "true");
  if (shouldScroll) section.scrollIntoView({ behavior: "smooth", block: "start" });
  loadLiveriesFolder("", []);
}

function logoutLiveries() {
  clearLiveriesSession();
  var section = document.getElementById("liveries");
  var entry = document.getElementById("liveries-entry");
  if (section) section.hidden = true;
  if (entry) entry.setAttribute("aria-expanded", "false");
  liveriesPath = [];
  liveriesDirectory = null;
  liveriesStatusKey = "";
  openLiveriesLogin();
}

function loadLiveriesFolder(folderId, nextPath) {
  if (!liveriesSession) {
    handleExpiredLiveriesSession();
    return;
  }

  liveriesStatusKey = "liveries_loading";
  renderLiveriesStatus();

  liveriesApiPost({
    action: "liveriesList",
    token: liveriesSession.token,
    folderId: folderId || ""
  })
    .then(function (data) {
      if (data.error) {
        if (data.code === "UNAUTHORIZED") {
          handleExpiredLiveriesSession();
          return;
        }
        throw new Error("Liveries API error");
      }

      liveriesDirectory = {
        current: data.current || { id: "", name: "Liveries" },
        folders: data.folders || [],
        files: data.files || []
      };

      if (nextPath.length === 0) {
        liveriesPath = [{ id: "", name: liveriesDirectory.current.name || "Liveries" }];
      } else {
        liveriesPath = nextPath;
      }
      liveriesStatusKey = "";
      renderLiveriesBrowser();
    })
    .catch(function () {
      liveriesStatusKey = "liveries_error";
      renderLiveriesStatus();
    });
}

function openLiveriesFolder(folderId, name) {
  var nextPath = liveriesPath.slice();
  nextPath.push({ id: folderId, name: name });
  loadLiveriesFolder(folderId, nextPath);
}

function navigateLiveriesBreadcrumb(index) {
  if (index < 0 || index >= liveriesPath.length) return;
  var nextPath = liveriesPath.slice(0, index + 1);
  loadLiveriesFolder(nextPath[index].id, nextPath.length === 1 ? [] : nextPath);
}

function renderLiveriesBrowser() {
  renderLiveriesBreadcrumbs();
  renderLiveriesDirectory();
  renderLiveriesStatus();
}

function renderLiveriesBreadcrumbs() {
  var breadcrumb = document.getElementById("liveries-breadcrumb");
  if (!breadcrumb) return;

  breadcrumb.innerHTML = liveriesPath.map(function (item, index) {
    var isCurrent = index === liveriesPath.length - 1;
    var separator = index > 0 ? '<span class="liveries-breadcrumb-separator" aria-hidden="true">›</span>' : "";
    return separator + '<button type="button" class="liveries-breadcrumb-item"' +
      ' data-index="' + index + '"' +
      (isCurrent ? ' aria-current="page" disabled' : "") + '>' +
      escLiveriesHtml(item.name) + '</button>';
  }).join("");

  var buttons = breadcrumb.querySelectorAll("[data-index]");
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener("click", function () {
      navigateLiveriesBreadcrumb(Number(this.dataset.index));
    });
  }
}

function renderLiveriesDirectory() {
  var grid = document.getElementById("liveries-grid");
  if (!grid || !liveriesDirectory) return;

  var folders = liveriesDirectory.folders;
  var files = liveriesDirectory.files;

  if (folders.length === 0 && files.length === 0) {
    grid.innerHTML = '<p class="muted liveries-empty">' +
      escLiveriesHtml(getLiveriesText("liveries_empty")) + '</p>';
    return;
  }

  var folderHtml = folders.map(function (folder) {
    return '<button type="button" class="liveries-folder"' +
      ' data-folder-id="' + escLiveriesAttr(folder.id) + '"' +
      ' data-folder-name="' + escLiveriesAttr(folder.name) + '">' +
      '<span class="liveries-folder-icon" aria-hidden="true">▸</span>' +
      '<span>' + escLiveriesHtml(folder.name) + '</span>' +
      '</button>';
  }).join("");

  var fileHtml = files.map(function (file) {
    var safeUrl = /^https:\/\//i.test(file.downloadUrl || "") ? file.downloadUrl : "";
    return '<article class="liveries-file">' +
      '<div class="liveries-file-main">' +
      '<span class="liveries-file-badge" aria-hidden="true">TGA</span>' +
      '<div class="liveries-file-details">' +
      '<strong class="liveries-file-name">' + escLiveriesHtml(file.name) + '</strong>' +
      '<span class="liveries-file-size">' + escLiveriesHtml(formatLiveriesSize(file.size)) + '</span>' +
      '</div></div>' +
      (safeUrl
        ? '<a class="btn btn-primary liveries-download" href="' + escLiveriesAttr(safeUrl) +
          '" target="_blank" rel="noreferrer">' + escLiveriesHtml(getLiveriesText("liveries_download")) + '</a>'
        : '<span class="muted">' + escLiveriesHtml(getLiveriesText("liveries_error")) + '</span>') +
      '</article>';
  }).join("");

  grid.innerHTML = folderHtml + fileHtml;

  var folderButtons = grid.querySelectorAll("[data-folder-id]");
  for (var i = 0; i < folderButtons.length; i++) {
    folderButtons[i].addEventListener("click", function () {
      openLiveriesFolder(this.dataset.folderId, this.dataset.folderName);
    });
  }
}

function renderLiveriesStatus() {
  var status = document.getElementById("liveries-status");
  if (!status) return;
  status.textContent = liveriesStatusKey ? getLiveriesText(liveriesStatusKey) : "";
  status.hidden = !liveriesStatusKey;
}

function renderLiveriesLoginStatus() {
  var status = document.getElementById("liveries-login-status");
  if (!status) return;
  status.textContent = liveriesLoginStatusKey ? getLiveriesText(liveriesLoginStatusKey) : "";
  status.hidden = !liveriesLoginStatusKey;
}

function refreshLiveriesLanguage() {
  renderLiveriesLoginStatus();
  if (liveriesDirectory) renderLiveriesBrowser();
  else renderLiveriesStatus();
}

function handleExpiredLiveriesSession() {
  clearLiveriesSession();
  var section = document.getElementById("liveries");
  var entry = document.getElementById("liveries-entry");
  if (section) section.hidden = true;
  if (entry) entry.setAttribute("aria-expanded", "false");
  openLiveriesLogin("liveries_session_expired");
}

function liveriesApiPost(values) {
  var body = new URLSearchParams();
  Object.keys(values).forEach(function (key) {
    body.append(key, values[key]);
  });

  return fetch(GALLERY_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body: body.toString(),
    cache: "no-store",
    redirect: "follow"
  }).then(function (response) {
    if (!response.ok) throw new Error("HTTP " + response.status);
    return response.json();
  });
}

function readLiveriesSession() {
  try {
    var stored = sessionStorage.getItem(LIVERIES_SESSION_KEY);
    if (!stored) return null;
    var session = JSON.parse(stored);
    if (!session.token || Number(session.expiresAt) <= Math.floor(Date.now() / 1000)) {
      clearLiveriesSession();
      return null;
    }
    return session;
  } catch (error) {
    clearLiveriesSession();
    return null;
  }
}

function writeLiveriesSession(session) {
  try {
    sessionStorage.setItem(LIVERIES_SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    // The active page can still use the in-memory token if storage is blocked.
  }
}

function clearLiveriesSession() {
  liveriesSession = null;
  try {
    sessionStorage.removeItem(LIVERIES_SESSION_KEY);
  } catch (error) {
    // Nothing else is required when browser storage is unavailable.
  }
}

function getLiveriesText(key) {
  var lang = typeof getCurrentSiteLang === "function" ? getCurrentSiteLang() : "sk";
  var dict = translations[lang] || translations.sk;
  return dict[key] || translations.sk[key] || key;
}

function formatLiveriesSize(bytes) {
  var value = Number(bytes) || 0;
  if (value < 1024) return value + " B";
  if (value < 1024 * 1024) return formatLiveriesNumber_(value / 1024) + " KB";
  if (value < 1024 * 1024 * 1024) return formatLiveriesNumber_(value / (1024 * 1024)) + " MB";
  return formatLiveriesNumber_(value / (1024 * 1024 * 1024)) + " GB";
}

function formatLiveriesNumber_(value) {
  return value >= 10 || value % 1 === 0 ? String(Math.round(value)) : value.toFixed(1);
}

function escLiveriesHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escLiveriesAttr(value) {
  return escLiveriesHtml(value);
}

document.addEventListener("DOMContentLoaded", initLiveries);
