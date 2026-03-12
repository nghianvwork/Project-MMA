const express = require("express");
const router = express.Router();
const medicationLogController = require("../controllers/medicationLogController");
const { identifyUser } = require("../middleware/identifyUser");

router.use(identifyUser);

router.get("/", medicationLogController.getMedicationLogs);
router.get("/summary", medicationLogController.getMedicationSummary);
router.post("/", medicationLogController.createMedicationLog);
router.put("/:id", medicationLogController.updateMedicationLog);
router.delete("/:id", medicationLogController.deleteMedicationLog);

module.exports = router;
