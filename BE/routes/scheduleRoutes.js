const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { authenticateUser } = require('../middleware/auth');
const { validateSchedule } = require('../middleware/validator');

// Áp dụng middleware xác thực
router.use(authenticateUser);

// Routes cho lịch uống thuốc
router.get('/', scheduleController.getSchedules);
router.get('/date/:date', scheduleController.getSchedulesByDate);
router.get('/:id', scheduleController.getScheduleById);
router.post('/', validateSchedule, scheduleController.createSchedule);
router.put('/:id', validateSchedule, scheduleController.updateSchedule);
router.delete('/:id', scheduleController.deleteSchedule);

module.exports = router;
