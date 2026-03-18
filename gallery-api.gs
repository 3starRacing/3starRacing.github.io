// Google Apps Script — Gallery API for 3Star Racing
// Setup:
// 1. Replace ROOT_FOLDER_ID with your shared Drive folder ID.
// 2. Deploy: Deploy → New deployment → Web app
//    Execute as: Me
//    Who has access: Anyone
// 3. Copy the /exec URL into gallery.js as GALLERY_API_URL.

var ROOT_FOLDER_ID = "REPLACE_WITH_YOUR_ROOT_FOLDER_ID";

function doGet(e) {
  var action   = e && e.parameter && e.parameter.action   || "";
  var folderId = e && e.parameter && e.parameter.folderId || "";

  var output;

  if (action === "albums") {
    output = getAlbums();
  } else if (action === "photos" && folderId) {
    output = getPhotos(folderId);
  } else {
    output = { error: "Invalid request" };
  }

  return ContentService
    .createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

function getAlbums() {
  try {
    var root      = DriveApp.getFolderById(ROOT_FOLDER_ID);
    var iter      = root.getFolders();
    var albums    = [];
    while (iter.hasNext()) {
      var f = iter.next();
      albums.push({ id: f.getId(), name: f.getName() });
    }
    albums.sort(function(a, b) { return a.name.localeCompare(b.name); });
    return { albums: albums };
  } catch (err) {
    return { error: err.message };
  }
}

function getPhotos(folderId) {
  try {
    var folder = DriveApp.getFolderById(folderId);
    var iter   = folder.getFiles();
    var photos = [];
    while (iter.hasNext()) {
      var f = iter.next();
      if (f.getMimeType().indexOf("image/") === 0) {
        photos.push({ id: f.getId(), name: f.getName() });
      }
    }
    photos.sort(function(a, b) { return a.name.localeCompare(b.name); });
    return { photos: photos };
  } catch (err) {
    return { error: err.message };
  }
}
