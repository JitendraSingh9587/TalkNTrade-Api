const fs = require("fs");
const path = require("path");
const localMediaStorage = require("./localMediaStorage");
const mediaService = require("./mediaService");
const settingsCache = require("../shared/services/settingsCache");

const IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function getPublicBaseUrl() {
  const base = settingsCache.getSetting(
    "MEDIA_PUBLIC_BASE_URL",
    "http://localhost:3000",
  );
  return String(base || "").replace(/\/$/, "");
}

/**
 * Save logo/banner during organisation setup (no organisation id yet).
 * @param {Express.Multer.File|null} file
 * @param {string} kind — "logo" | "banner"
 * @param {{ id: number, role: string, organisation_id?: number|null }} actor
 */
async function saveUpload(file, kind, actor) {
  if (actor.role !== "ADMIN" || actor.organisation_id) {
    const err = new Error(
      "Only administrators who have not created an organisation yet can upload",
    );
    err.statusCode = 403;
    throw err;
  }

  const k = String(kind || "").trim().toLowerCase();
  if (k !== "logo" && k !== "banner") {
    const err = new Error('kind must be "logo" or "banner"');
    err.statusCode = 400;
    throw err;
  }

  if (!file || !file.buffer) {
    const err = new Error("file is required (multipart field: file)");
    err.statusCode = 400;
    throw err;
  }

  const mime = String(file.mimetype || "").toLowerCase();
  if (!IMAGE_MIMES.has(mime)) {
    const err = new Error("Only JPEG, PNG, WebP, or GIF images are allowed");
    err.statusCode = 400;
    throw err;
  }

  const max = mediaService.getMaxUploadBytes();
  if (file.size > max) {
    const err = new Error(`File too large. Maximum size is ${max} bytes`);
    err.statusCode = 400;
    throw err;
  }

  const { absolutePath, storage_key, filename } =
    localMediaStorage.allocateOrgSetupAssetPath(k, mime, file.originalname);

  try {
    fs.writeFileSync(absolutePath, file.buffer);
  } catch (e) {
    const err = new Error("Could not store uploaded file");
    err.statusCode = 500;
    throw err;
  }

  const base = getPublicBaseUrl();
  const pathname = `/api/v1/media/org-setup/${k}/${filename}`;
  const public_url = base ? `${base}${pathname}` : pathname;

  return {
    public_url,
    url: public_url,
    kind: k,
    filename,
    storage_key,
  };
}

/**
 * Resolve absolute path for a public org-setup file (validates name).
 * @param {"logo"|"banner"} kind
 * @param {string} filename
 */
function resolveOrgSetupPublicFile(kind, filename) {
  const k = String(kind || "").toLowerCase();
  if (k !== "logo" && k !== "banner") {
    const err = new Error("Not found");
    err.statusCode = 404;
    throw err;
  }
  const name = String(filename || "").trim();
  if (!/^[0-9a-f-]{36}\.(jpe?g|png|webp|gif)$/i.test(name)) {
    const err = new Error("Not found");
    err.statusCode = 404;
    throw err;
  }
  const sub = localMediaStorage.orgSetupSubdir(k);
  const storage_key = path.join(sub, name).replace(/\\/g, "/");
  return localMediaStorage.resolveAbsolutePath(storage_key);
}

function mimeForFilename(filename) {
  const ext = path.extname(filename || "").toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  return "application/octet-stream";
}

module.exports = {
  saveUpload,
  resolveOrgSetupPublicFile,
  mimeForFilename,
};
