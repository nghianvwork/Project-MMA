const express = require("express");
const router = express.Router();
const accessGrantController = require("../controllers/accessGrantController");
const { identifyUser } = require("../middleware/identifyUser");

router.use(identifyUser);

router.get("/", accessGrantController.getAccessGrants);
router.post("/", accessGrantController.createAccessGrant);
router.put("/:id", accessGrantController.updateAccessGrant);
router.delete("/:id", accessGrantController.deleteAccessGrant);

module.exports = router;
