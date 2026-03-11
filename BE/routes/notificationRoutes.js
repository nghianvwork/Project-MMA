const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const { identifyUser } = require("../middleware/identifyUser");

router.use(identifyUser);

router.get("/", notificationController.getNotificationSettings);
router.put("/", notificationController.updateNotificationSettings);

module.exports = router;
