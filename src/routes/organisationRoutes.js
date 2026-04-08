const express = require("express");
const router = express.Router();
const asyncHandler = require("../utils/asyncHandler");
const {
  listOrganisations,
  createOrganisation,
  getOrganisationById,
  updateOrganisation,
  deleteOrganisation,
} = require("../controllers/organisationController");

router.get("/", asyncHandler(listOrganisations));
router.post("/", asyncHandler(createOrganisation));
router.get("/:id", asyncHandler(getOrganisationById));
router.put("/:id", asyncHandler(updateOrganisation));
router.delete("/:id", asyncHandler(deleteOrganisation));

module.exports = router;
