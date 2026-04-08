const fs = require("fs");
const path = require("path");
const { Media, Organisation } = require("../models");
const { Op } = require("sequelize");
const settingsCache = require("../shared/services/settingsCache");
const organisationService = require("./organisationService");
const localMediaStorage = require("./localMediaStorage");

const PUBLIC_PATH_PREFIX = "/api/v1/media/public";

function getMaxUploadBytes() {
  const raw = settingsCache.getSetting("MEDIA_MAX_UPLOAD_BYTES", "5242880");
  const n = parseInt(String(raw).trim(), 10);
  if (Number.isNaN(n) || n < 1) return 5242880;
  return Math.min(n, 1024 * 1024 * 500);
}

function getPublicBaseUrl() {
  const base = settingsCache.getSetting(
    "MEDIA_PUBLIC_BASE_URL",
    "http://localhost:3000",
  );
  return String(base || "").replace(/\/$/, "");
}

function publicPathForId(id) {
  return `${PUBLIC_PATH_PREFIX}/${id}`;
}

function toPublicJson(mediaRow) {
  const row = mediaRow.toJSON ? mediaRow.toJSON() : mediaRow;
  const base = getPublicBaseUrl();
  const pathname = row.url && row.url.startsWith("/") ? row.url : `/${row.url}`;
  return {
    ...row,
    public_url: base ? `${base}${pathname}` : pathname,
  };
}

function assertActorCanAccessOrg(actor, organisationId) {
  if (actor.role === "SUPER_ADMIN") return;
  if (actor.role === "ADMIN") {
    if (
      !actor.organisation_id ||
      parseInt(actor.organisation_id, 10) !== parseInt(organisationId, 10)
    ) {
      const err = new Error("You cannot manage media for another organisation");
      err.statusCode = 403;
      throw err;
    }
    return;
  }
  const err = new Error("Access denied");
  err.statusCode = 403;
  throw err;
}

function resolveOrganisationIdForCreate(actor, body) {
  if (actor.role === "SUPER_ADMIN") {
    const raw = body.organisation_id;
    const n = parseInt(raw, 10);
    if (!raw || Number.isNaN(n)) {
      const err = new Error("organisation_id is required for this upload");
      err.statusCode = 400;
      throw err;
    }
    return n;
  }
  if (actor.role === "ADMIN") {
    if (!actor.organisation_id) {
      const err = new Error("Your account is not linked to an organisation");
      err.statusCode = 403;
      throw err;
    }
    return parseInt(actor.organisation_id, 10);
  }
  const err = new Error("Access denied");
  err.statusCode = 403;
  throw err;
}

/**
 * Move multer temp file into final org folder (multer can write directly to final path — controller will use diskStorage).
 * @param {Express.Multer.File} file
 * @param {number} organisationId
 */
async function createFromUploadedFile(file, actor, body) {
  if (!file || !file.buffer) {
    const err = new Error("file is required (multipart field: file)");
    err.statusCode = 400;
    throw err;
  }

  const maxBytes = getMaxUploadBytes();
  if (file.size > maxBytes) {
    const err = new Error(`File too large. Maximum size is ${maxBytes} bytes`);
    err.statusCode = 400;
    throw err;
  }

  const orgId = resolveOrganisationIdForCreate(actor, body);
  await organisationService.requireActiveOrganisation(orgId);
  assertActorCanAccessOrg(actor, orgId);

  const displayName =
    (body.name && String(body.name).trim()) ||
    path.basename(file.originalname || "upload") ||
    "upload";

  const { absolutePath, storage_key } = localMediaStorage.allocatePath(
    orgId,
    file.originalname,
  );

  try {
    fs.writeFileSync(absolutePath, file.buffer);
  } catch (e) {
    const err = new Error("Could not store uploaded file");
    err.statusCode = 500;
    throw err;
  }

  const size = file.buffer.length;
  const mime = file.mimetype || "application/octet-stream";

  const media = await Media.create({
    organisation_id: orgId,
    name: displayName,
    description: body.description != null ? String(body.description) : null,
    type: mime,
    size,
    storage_key,
    url: "__pending__",
  });

  await media.update({ url: publicPathForId(media.id) });
  await media.reload();
  return toPublicJson(media);
}

/**
 * @param {{ role: string, organisation_id?: number|null }} actor
 */
async function listMedia(
  actor,
  { page = 1, limit = 20, organisation_id: filterOrg } = {},
) {
  const p = parseInt(page, 10) || 1;
  const l = Math.min(parseInt(limit, 10) || 20, 100);
  const offset = (p - 1) * l;

  const where = {};
  if (actor.role === "ADMIN") {
    where.organisation_id = actor.organisation_id;
  } else if (actor.role === "SUPER_ADMIN" && filterOrg) {
    where.organisation_id = parseInt(filterOrg, 10);
  }

  const { count, rows } = await Media.findAndCountAll({
    where,
    limit: l,
    offset,
    order: [["created_at", "DESC"]],
    include: [
      {
        model: Organisation,
        as: "organisation",
        attributes: ["id", "name"],
      },
    ],
  });

  return {
    media: rows.map((r) => toPublicJson(r)),
    pagination: {
      total: count,
      page: p,
      limit: l,
      totalPages: Math.ceil(count / l),
    },
  };
}

async function getMediaById(id, actor) {
  const media = await Media.findByPk(id, {
    include: [
      {
        model: Organisation,
        as: "organisation",
        attributes: ["id", "name", "status"],
      },
    ],
  });
  if (!media) {
    const err = new Error("Media not found");
    err.statusCode = 404;
    throw err;
  }
  assertActorCanAccessOrg(actor, media.organisation_id);
  return toPublicJson(media);
}

async function updateMedia(id, body, actor) {
  const media = await Media.findByPk(id);
  if (!media) {
    const err = new Error("Media not found");
    err.statusCode = 404;
    throw err;
  }
  assertActorCanAccessOrg(actor, media.organisation_id);

  const updates = {};
  if (body.name !== undefined) {
    if (!String(body.name).trim()) {
      const err = new Error("name cannot be empty");
      err.statusCode = 400;
      throw err;
    }
    updates.name = String(body.name).trim();
  }
  if (body.description !== undefined) {
    updates.description =
      body.description === null || body.description === ""
        ? null
        : String(body.description);
  }
  if (Object.keys(updates).length === 0) {
    const err = new Error("No fields to update");
    err.statusCode = 400;
    throw err;
  }
  await media.update(updates);
  await media.reload();
  return toPublicJson(media);
}

async function deleteMedia(id, actor) {
  const media = await Media.findByPk(id);
  if (!media) {
    const err = new Error("Media not found");
    err.statusCode = 404;
    throw err;
  }
  assertActorCanAccessOrg(actor, media.organisation_id);
  localMediaStorage.removeFile(media.storage_key);
  await media.destroy();
  return { success: true };
}

/**
 * Public file stream path (no auth).
 * @returns {{ media: Media, absolutePath: string }}
 */
async function getPublicFilePayload(id) {
  const media = await Media.findByPk(id);
  if (!media) {
    const err = new Error("Not found");
    err.statusCode = 404;
    throw err;
  }
  const absolutePath = localMediaStorage.resolveAbsolutePath(media.storage_key);
  if (!fs.existsSync(absolutePath)) {
    const err = new Error("Not found");
    err.statusCode = 404;
    throw err;
  }
  return { media, absolutePath };
}

module.exports = {
  getMaxUploadBytes,
  getPublicBaseUrl,
  publicPathForId,
  createFromUploadedFile,
  listMedia,
  getMediaById,
  updateMedia,
  deleteMedia,
  getPublicFilePayload,
};
