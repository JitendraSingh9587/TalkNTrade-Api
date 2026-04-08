const express = require("express");
const router = express.Router();
const asyncHandler = require("../utils/asyncHandler");
const {
  listOrganisations,
  createOrganisation,
} = require("../controllers/organisationController");

router.get("/", asyncHandler(listOrganisations));
router.post("/", asyncHandler(createOrganisation));

module.exports = router;
