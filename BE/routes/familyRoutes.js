const express = require("express");
const router = express.Router();
const familyController = require("../controllers/familyController");
const { identifyUser } = require("../middleware/identifyUser");

router.use(identifyUser);

router.get("/", familyController.getFamilyMembers);
router.get("/:id", familyController.getFamilyMemberById);
router.post("/", familyController.createFamilyMember);
router.put("/:id", familyController.updateFamilyMember);
router.delete("/:id", familyController.deleteFamilyMember);

module.exports = router;
