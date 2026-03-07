const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { verifyToken } = require("../middleware/userMiddleware");

router.post("/register", userController.register);
router.post("/login", userController.login);
router.post("/google-login", userController.googleLogin);
router.get("/profile", verifyToken, userController.getProfile);
router.put("/profile", verifyToken, userController.updateProfile);
router.post("/forgot-password", userController.forgotPassword);
router.post("/verify-reset-otp", userController.verifyResetOtp);
router.post("/reset-password", userController.resetPassword);

module.exports = router;
