// gallery.js — Photo gallery for 3Star Racing
// Uses Google Drive API v3 with a public API key.
// Structure: one root folder → subfolders = albums → image files = photos.

// --- CONFIG ---
// Paste the Google Apps Script /exec URL here (see gallery-api.gs for setup).
// No API key needed — the script runs server-side with its own credentials.
var GALLERY_API_URL = "https://script.google.com/macros/s/AKfycbyN9Ghoj9yvyWNTKhHuuBDuzMTSzQZ2tAetGlKwVKB4gF9nml__g8mGDnyvYZ9m-PpH4g/exec";

// --- STATE ---
var galleryAlbums = [];   // [{id, name}, ...] — subfolders of the root folder
var galleryPhotos = [];   // [{id, name}, ...] — photos in the active album
var activeAlbum = null; // currently selected album folder ID

// --- LOAD ---

function loadGallery() {
  var grid = document.getElementById("gallery-grid");
  if (!grid) return;

  fetch(GALLERY_API_URL + "?action=albums")
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then(function (data) {
      if (data.error) throw new Error(data.error);
      galleryAlbums = data.albums || [];
      if (galleryAlbums.length === 0) {
        showGalleryMsg("gallery_empty");
        return;
      }
      renderGalleryTabs();
      selectAlbum(galleryAlbums[0].id);
    })
    .catch(function () {
      showGalleryMsg("gallery_error");
    });
}

function loadAlbumPhotos(folderId) {
  showGalleryMsg("gallery_loading");

  fetch(GALLERY_API_URL + "?action=photos&folderId=" + encodeURIComponent(folderId))
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then(function (data) {
      if (data.error) throw new Error(data.error);
      galleryPhotos = data.photos || [];
      renderGalleryGrid();
    })
    .catch(function () {
      showGalleryMsg("gallery_error");
    });
}

// --- ALBUMS ---

function renderGalleryTabs() {
  var tabsEl = document.getElementById("gallery-tabs");
  if (!tabsEl) return;

  tabsEl.innerHTML = galleryAlbums.map(function (album) {
    var isActive = album.id === activeAlbum;
    return '<button class="gallery-tab' + (isActive ? ' gallery-tab--active' : '') + '"' +
      ' data-album="' + escGalleryAttr(album.id) + '"' +
      ' role="tab" aria-selected="' + (isActive ? 'true' : 'false') + '"' +
      ' onclick="selectAlbum(\'' + escGalleryAttr(album.id) + '\')">' +
      escGalleryHtml(album.name) +
      '</button>';
  }).join("");
}

function selectAlbum(albumId) {
  activeAlbum = albumId;

  var tabs = document.querySelectorAll(".gallery-tab");
  for (var i = 0; i < tabs.length; i++) {
    var isActive = tabs[i].dataset.album === albumId;
    tabs[i].classList.toggle("gallery-tab--active", isActive);
    tabs[i].setAttribute("aria-selected", isActive ? "true" : "false");
  }

  loadAlbumPhotos(albumId);
}

// --- GRID ---

function renderGalleryGrid() {
  var grid = document.getElementById("gallery-grid");
  if (!grid) return;

  if (galleryPhotos.length === 0) {
    showGalleryMsg("gallery_empty");
    return;
  }

  grid.innerHTML = galleryPhotos.map(function (photo, idx) {
    var label = photoLabel(photo.name);
    var thumb = "https://drive.google.com/thumbnail?id=" + photo.id + "&sz=w400";
    return '<button class="gallery-item"' +
      ' aria-label="' + escGalleryAttr(label) + '"' +
      ' data-idx="' + idx + '"' +
      ' onclick="openLightbox(' + idx + ')">' +
      '<img class="gallery-thumb" src="' + thumb + '"' +
      ' alt="' + escGalleryAttr(label) + '" loading="lazy"' +
      ' onerror="this.style.opacity=\'0.25\'" />' +
      '</button>';
  }).join("");
}

// --- LIGHTBOX ---

var lightboxIdx = 0;

function openLightbox(idx) {
  lightboxIdx = idx;
  showLightboxPhoto();
  var lb = document.getElementById("gallery-lightbox");
  lb.hidden = false;
  document.body.style.overflow = "hidden";
  var closeBtn = document.getElementById("lightbox-close");
  if (closeBtn) closeBtn.focus();
}

function showLightboxPhoto() {
  var photo = galleryPhotos[lightboxIdx];
  if (!photo) return;

  var img = document.getElementById("lightbox-img");
  var captionEl = document.getElementById("lightbox-caption");
  var prev = document.getElementById("lightbox-prev");
  var next = document.getElementById("lightbox-next");

  img.src = "https://drive.google.com/thumbnail?id=" + photo.id + "&sz=w1920";
  img.alt = photoLabel(photo.name);
  captionEl.textContent = photoLabel(photo.name);

  var atStart = lightboxIdx === 0;
  var atEnd = lightboxIdx === galleryPhotos.length - 1;
  prev.disabled = atStart;
  prev.style.opacity = atStart ? "0.3" : "1";
  next.disabled = atEnd;
  next.style.opacity = atEnd ? "0.3" : "1";
}

function lightboxNav(dir) {
  lightboxIdx = Math.max(0, Math.min(galleryPhotos.length - 1, lightboxIdx + dir));
  showLightboxPhoto();
}

function closeLightbox() {
  var lb = document.getElementById("gallery-lightbox");
  lb.hidden = true;
  document.body.style.overflow = "";
  var btn = document.querySelector(".gallery-item[data-idx='" + lightboxIdx + "']");
  if (btn) btn.focus();
}

document.addEventListener("keydown", function (e) {
  var lb = document.getElementById("gallery-lightbox");
  if (!lb || lb.hidden) return;
  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowLeft") lightboxNav(-1);
  if (e.key === "ArrowRight") lightboxNav(1);
});

document.addEventListener("click", function (e) {
  var lb = document.getElementById("gallery-lightbox");
  if (lb && !lb.hidden && e.target === lb) closeLightbox();
});

// --- HELPERS ---


function showGalleryMsg(i18nKey) {
  var grid = document.getElementById("gallery-grid");
  if (!grid) return;
  var lang = getGalleryLang();
  var dict = translations[lang] || translations.sk;
  grid.innerHTML = '<p class="muted">' + escGalleryHtml(dict[i18nKey] || i18nKey) + '</p>';
}

function getGalleryLang() {
  var l = document.documentElement.lang;
  if (l === "cs") return "cz";
  if (l === "en") return "en";
  return "sk";
}

function stripExt(name) {
  return (name || "").replace(/\.[^.]+$/, "");
}

// Display label: strip file extension, then leading sort-prefix (e.g. "01_", "03 ", "2-")
function photoLabel(name) {
  return stripExt(name).replace(/^\d+[_\-\s]+/, "").replace(/_/g, " ").trim();
}

function escGalleryAttr(s) {
  return (s || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function escGalleryHtml(s) {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
