const express = require("express");
const router = express.Router();
const healthController = require("../controllers/healthController");
const { identifyUser } = require("../middleware/identifyUser");

router.use(identifyUser);

router.get("/", healthController.getHealthRecords);
router.post("/", healthController.createHealthRecord);
router.put("/:id", healthController.updateHealthRecord);
router.delete("/:id", healthController.deleteHealthRecord);

module.exports = router;
