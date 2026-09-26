// Google Apps Script — Gallery API for 3Star Racing
// Setup:
// 1. In Project Settings → Script Properties, add:
//    ROOT_FOLDER_ID — the ID of the shared Gallery folder
// 2. Deploy: Deploy → New deployment → Web app
//    Execute as: Me
//    Who has access: Anyone
// 3. Copy the /exec URL into gallery.js as GALLERY_API_URL.
//
// Optional password-gated Liveries API setup:
// 1. In Project Settings → Script Properties, add:
//    LIVERIES_ROOT_FOLDER_ID  — the private ID of the Liveries folder
//    LIVERIES_PASSWORD_PLAIN  — the shared password (temporary)
// 2. Select configureLiveries in the editor and run it once. It stores the
//    password hash, creates a signing secret, and deletes the plaintext value.
// 3. Set the Liveries folder to "Anyone with the link — Viewer" so returned
//    download URLs work without requiring a Google account.
// 4. Deploy a new web app version. Never paste secret values into this repo.

var LIVERIES_TOKEN_TTL_SECONDS = 2 * 60 * 60;

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

  return jsonOutput_(output);
}

function doPost(e) {
  var params = e && e.parameter || {};
  var action = params.action || "";
  var output;

  try {
    if (action === "liveriesLogin") {
      output = liveriesLogin(params.password || "");
    } else if (action === "liveriesList") {
      output = liveriesList(params.token || "", params.folderId || "");
    } else {
      output = liveriesUnauthorized_();
    }
  } catch (err) {
    console.error("Liveries request failed", err);
    output = { error: "Request failed", code: "REQUEST_FAILED" };
  }

  return jsonOutput_(output);
}

function getAlbums() {
  try {
    var root      = DriveApp.getFolderById(getGalleryRootFolderId_());
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

function getGalleryRootFolderId_() {
  var folderId = PropertiesService
    .getScriptProperties()
    .getProperty("ROOT_FOLDER_ID") || "";

  if (!folderId) {
    throw new Error("ROOT_FOLDER_ID Script Property is not configured");
  }

  return folderId;
}

// --- PASSWORD-GATED LIVERIES API ---

function configureLiveries() {
  var properties = PropertiesService.getScriptProperties();
  var rootFolderId = properties.getProperty("LIVERIES_ROOT_FOLDER_ID") || "";
  var plaintextPassword = properties.getProperty("LIVERIES_PASSWORD_PLAIN") || "";

  if (!rootFolderId || !plaintextPassword) {
    throw new Error("Set LIVERIES_ROOT_FOLDER_ID and LIVERIES_PASSWORD_PLAIN first");
  }

  properties.setProperty("LIVERIES_PASSWORD_HASH", sha256Hex_(plaintextPassword));
  properties.deleteProperty("LIVERIES_PASSWORD_PLAIN");

  if (!properties.getProperty("LIVERIES_TOKEN_SECRET")) {
    properties.setProperty(
      "LIVERIES_TOKEN_SECRET",
      Utilities.getUuid() + Utilities.getUuid() + Utilities.getUuid()
    );
  }

  console.log("Liveries configured. The plaintext password property was deleted.");
}

function liveriesLogin(password) {
  var config = getLiveriesConfig_();
  var suppliedHash = sha256Hex_(password || "");

  if (!constantTimeEquals_(suppliedHash, config.passwordHash)) {
    return liveriesUnauthorized_();
  }

  var expiresAt = Math.floor(Date.now() / 1000) + LIVERIES_TOKEN_TTL_SECONDS;
  return {
    token: createLiveriesToken_(expiresAt, config.tokenSecret),
    expiresAt: expiresAt
  };
}

function liveriesList(token, folderId) {
  var config = getLiveriesConfig_();
  if (!verifyLiveriesToken_(token, config.tokenSecret)) {
    return liveriesUnauthorized_();
  }

  var requestedId = folderId || config.rootFolderId;
  var folder = DriveApp.getFolderById(requestedId);
  if (!isFolderWithinRoot_(folder, config.rootFolderId)) {
    return liveriesUnauthorized_();
  }

  var folders = [];
  var folderIter = folder.getFolders();
  while (folderIter.hasNext()) {
    var child = folderIter.next();
    folders.push({ id: child.getId(), name: child.getName() });
  }

  var files = [];
  var fileIter = folder.getFiles();
  while (fileIter.hasNext()) {
    var file = fileIter.next();
    if (isTgaFileName_(file.getName())) {
      files.push({
        id: file.getId(),
        name: file.getName(),
        size: file.getSize(),
        downloadUrl: getPublicDriveDownloadUrl_(file)
      });
    }
  }

  folders.sort(compareDriveItems_);
  files.sort(compareDriveItems_);

  return {
    current: {
      // Do not expose the public root folder ID. An empty ID means root.
      id: requestedId === config.rootFolderId ? "" : folder.getId(),
      name: folder.getName()
    },
    folders: folders,
    files: files
  };
}

function getLiveriesConfig_() {
  var properties = PropertiesService.getScriptProperties();
  var config = {
    rootFolderId: properties.getProperty("LIVERIES_ROOT_FOLDER_ID") || "",
    passwordHash: (properties.getProperty("LIVERIES_PASSWORD_HASH") || "").toLowerCase(),
    tokenSecret: properties.getProperty("LIVERIES_TOKEN_SECRET") || ""
  };

  if (!config.rootFolderId || !config.passwordHash || !config.tokenSecret) {
    throw new Error("Liveries Script Properties are not configured");
  }

  return config;
}

function createLiveriesToken_(expiresAt, secret) {
  var payload = String(expiresAt) + "." + Utilities.getUuid();
  return payload + "." + signLiveriesPayload_(payload, secret);
}

function verifyLiveriesToken_(token, secret) {
  var parts = String(token || "").split(".");
  if (parts.length !== 3) return false;

  var expiresAt = Number(parts[0]);
  if (!isFinite(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) {
    return false;
  }

  var payload = parts[0] + "." + parts[1];
  var expected = signLiveriesPayload_(payload, secret);
  return constantTimeEquals_(parts[2], expected);
}

function signLiveriesPayload_(payload, secret) {
  var signature = Utilities.computeHmacSha256Signature(
    payload,
    secret,
    Utilities.Charset.UTF_8
  );
  return Utilities.base64EncodeWebSafe(signature).replace(/=+$/, "");
}

function sha256Hex_(value) {
  var digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(value),
    Utilities.Charset.UTF_8
  );

  return digest.map(function (byte) {
    var normalized = byte < 0 ? byte + 256 : byte;
    return ("0" + normalized.toString(16)).slice(-2);
  }).join("");
}

function constantTimeEquals_(left, right) {
  left = String(left || "");
  right = String(right || "");
  var mismatch = left.length ^ right.length;
  var maxLength = Math.max(left.length, right.length);

  for (var i = 0; i < maxLength; i++) {
    var leftCode = i < left.length ? left.charCodeAt(i) : 0;
    var rightCode = i < right.length ? right.charCodeAt(i) : 0;
    mismatch |= leftCode ^ rightCode;
  }

  return mismatch === 0;
}

function isFolderWithinRoot_(folder, rootFolderId) {
  var queue = [folder];
  var visited = {};
  var inspected = 0;

  while (queue.length > 0 && inspected < 1000) {
    var current = queue.shift();
    var currentId = current.getId();
    if (currentId === rootFolderId) return true;
    if (visited[currentId]) continue;

    visited[currentId] = true;
    inspected++;

    var parents = current.getParents();
    while (parents.hasNext()) queue.push(parents.next());
  }

  return false;
}

function isTgaFileName_(name) {
  return /\.tga$/i.test(String(name || ""));
}

function getPublicDriveDownloadUrl_(file) {
  var url = "https://drive.google.com/uc?export=download&id=" +
    encodeURIComponent(file.getId());
  var resourceKey = file.getResourceKey();

  if (resourceKey) {
    url += "&resourcekey=" + encodeURIComponent(resourceKey);
  }

  return url;
}

function compareDriveItems_(left, right) {
  return left.name.localeCompare(right.name, undefined, { sensitivity: "base" });
}

function liveriesUnauthorized_() {
  return { error: "Unauthorized", code: "UNAUTHORIZED" };
}

function jsonOutput_(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
