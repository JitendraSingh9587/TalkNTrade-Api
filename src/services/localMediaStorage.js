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

module.exports = {
  getStorageRoot,
  allocatePath,
  resolveAbsolutePath,
  removeFile,
};
