const multer = require("multer");
const mediaService = require("../services/mediaService");

/**
 * Multipart upload into memory; max size from MEDIA_MAX_UPLOAD_BYTES setting.
 */
function uploadMediaSingle(req, res, next) {
  const maxBytes = mediaService.getMaxUploadBytes();
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxBytes },
  }).single("file");

  upload(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        const e = new Error(
          `File too large. Maximum size is ${maxBytes} bytes (configured in MEDIA_MAX_UPLOAD_BYTES).`,
        );
        e.statusCode = 400;
        return next(e);
      }
      return next(err);
    }
    next();
  });
}

module.exports = {
  uploadMediaSingle,
};
