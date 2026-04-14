const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");

/**
 * Local filesystem storage (swap for S3 etc. later by implementing the same helpers).
 */

function getStorageRoot() {
  const raw =
    process.env.MEDIA_STORAGE_ROOT ||
    path.join(process.cwd(), "uploads", "media");
  return path.resolve(raw);
}

function orgDirName(organisationId) {
  return `org_${organisationId}`;
}

function ensureOrgDir(organisationId) {
  const root = getStorageRoot();
  const dir = path.join(root, orgDirName(organisationId));
  fs.mkdirSync(dir, { recursive: true });
  return { root, dir };
}

/**
 * @param {number|string} organisationId
 * @param {string} originalFilename
 * @returns {{ absolutePath: string, storage_key: string }}
 */
function allocatePath(organisationId, originalFilename) {
  const { root, dir } = ensureOrgDir(organisationId);
  const ext = path.extname(originalFilename || "") || "";
  const base = `${randomUUID()}${ext}`;
  const absolutePath = path.join(dir, base);
  const storage_key = path
    .join(orgDirName(organisationId), base)
    .replace(/\\/g, "/");
  return { absolutePath, storage_key, root };
}

/**
 * @param {string} storage_key
 * @returns {string} absolute path
 */
function resolveAbsolutePath(storage_key) {
  const root = getStorageRoot();
  const normalizedKey = String(storage_key || "").replace(/\\/g, "/");
  if (normalizedKey.includes("..") || normalizedKey.startsWith("/")) {
    const err = new Error("Invalid storage key");
    err.statusCode = 400;
    throw err;
  }
  const full = path.resolve(root, ...normalizedKey.split("/"));
  const rootResolved = path.resolve(root);
  if (!full.startsWith(rootResolved + path.sep) && full !== rootResolved) {
    const err = new Error("Invalid storage path");
    err.statusCode = 400;
    throw err;
  }
  return full;
}

function removeFile(storage_key) {
  try {
    const abs = resolveAbsolutePath(storage_key);
    if (fs.existsSync(abs)) {
      fs.unlinkSync(abs);
    }
  } catch {
    /* ignore missing */
  }
}

const ORG_SETUP_LOGO_DIR = "org_setup/logo";
const ORG_SETUP_BANNER_DIR = "org_setup/banner";

function orgSetupSubdir(kind) {
  const k = String(kind || "").toLowerCase();
  if (k === "banner") return ORG_SETUP_BANNER_DIR;
  return ORG_SETUP_LOGO_DIR;
}

function extFromImageMime(mime) {
  const m = String(mime || "").toLowerCase();
  if (m === "image/jpeg") return ".jpg";
  if (m === "image/png") return ".png";
  if (m === "image/webp") return ".webp";
  if (m === "image/gif") return ".gif";
  return null;
}

/**
 * Pre–organisation uploads (setup wizard). Stored under org_setup/logo or org_setup/banner.
 * @param {"logo"|"banner"} kind
 * @param {string} mime
 * @param {string} [originalFilename]
 * @returns {{ absolutePath: string, storage_key: string, filename: string }}
 */
function allocateOrgSetupAssetPath(kind, mime, originalFilename = "") {
  const sub = orgSetupSubdir(kind);
  const dir = path.join(getStorageRoot(), ...sub.split("/"));
  fs.mkdirSync(dir, { recursive: true });
  let ext = extFromImageMime(mime);
  if (!ext) {
    const e = path.extname(originalFilename || "").toLowerCase();
    if ([".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(e)) {
      ext = e === ".jpeg" ? ".jpg" : e;
    }
  }
  if (!ext) ext = ".png";
  const base = `${randomUUID()}${ext}`;
  const absolutePath = path.join(dir, base);
  const storage_key = path.join(sub, base).replace(/\\/g, "/");
  return { absolutePath, storage_key, filename: base };
}

/**
 * Profile avatars: uploads/media/user_avatars/{userId}/{uuid}.ext
 * @param {number|string} userId
 * @param {string} mime
 * @param {string} [originalFilename]
 * @returns {{ absolutePath: string, storage_key: string, filename: string }}
 */
function allocateUserAvatarPath(userId, mime, originalFilename = "") {
  const uid = String(parseInt(userId, 10) || 0);
  const sub = `user_avatars/${uid}`;
  const dir = path.join(getStorageRoot(), ...sub.split("/"));
  fs.mkdirSync(dir, { recursive: true });
  let ext = extFromImageMime(mime);
  if (!ext) {
    const e = path.extname(originalFilename || "").toLowerCase();
    if ([".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(e)) {
      ext = e === ".jpeg" ? ".jpg" : e;
    }
  }
  if (!ext) ext = ".png";
  const base = `${randomUUID()}${ext}`;
  const absolutePath = path.join(dir, base);
  const storage_key = path.join(sub, base).replace(/\\/g, "/");
  return { absolutePath, storage_key, filename: base };
}

/**
 * @param {number|string} userId
 * @param {string} filename
 * @returns {string} absolute path
 */
function resolveUserAvatarPublicFile(userId, filename) {
  const uid = String(parseInt(userId, 10) || 0);
  const name = String(filename || "").trim();
  if (!/^[0-9a-f-]{36}\.(jpe?g|png|webp|gif)$/i.test(name)) {
    const err = new Error("Not found");
    err.statusCode = 404;
    throw err;
  }
  const storage_key = path.join(`user_avatars/${uid}`, name).replace(
    /\\/g,
    "/",
  );
  return resolveAbsolutePath(storage_key);
}

module.exports = {
  getStorageRoot,
  allocatePath,
  resolveAbsolutePath,
  removeFile,
  allocateOrgSetupAssetPath,
  orgSetupSubdir,
  allocateUserAvatarPath,
  resolveUserAvatarPublicFile,
};
