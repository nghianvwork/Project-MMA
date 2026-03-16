const express = require("express");
const router = express.Router();
const { identifyUser } = require("../middleware/identifyUser");
const healthProfileController = require("../controllers/healthProfileController");

router.use(identifyUser);

router.get("/", healthProfileController.getHealthProfile);

module.exports = router;
