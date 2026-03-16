const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const { identifyUser } = require("../middleware/identifyUser");

router.use(identifyUser);

// Push token
router.post("/push-token", notificationController.registerPushToken);
router.delete("/push-token", notificationController.removePushToken);

// Notification settings
router.get("/", notificationController.getNotificationSettings);
router.put("/", notificationController.updateNotificationSettings);

module.exports = router;
