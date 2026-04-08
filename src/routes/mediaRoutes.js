const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { uploadMediaSingle } = require("../middleware/mediaUpload");
const {
  createMedia,
  listMedia,
  getMedia,
  updateMedia,
  deleteMedia,
} = require("../controllers/mediaController");

const router = express.Router();

router.post("/", uploadMediaSingle, asyncHandler(createMedia));
router.get("/", asyncHandler(listMedia));
router.get("/:id", asyncHandler(getMedia));
router.patch("/:id", asyncHandler(updateMedia));
router.delete("/:id", asyncHandler(deleteMedia));

module.exports = router;
