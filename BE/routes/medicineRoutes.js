const express = require('express');
const router = express.Router();
const medicineController = require('../controllers/medicineController');
const { authenticateUser } = require('../middleware/auth');
const { validateMedicine } = require('../middleware/validator');

// Áp dụng middleware xác thực cho tất cả routes
router.use(authenticateUser);

// Routes cho tủ thuốc
router.get('/', medicineController.getMedicines);
router.get('/low-stock', medicineController.getLowStockMedicines);
router.get('/:id', medicineController.getMedicineById);
router.post('/', validateMedicine, medicineController.createMedicine);
router.put('/:id', validateMedicine, medicineController.updateMedicine);
router.patch('/:id/stock', medicineController.updateStock);
router.delete('/:id', medicineController.deleteMedicine);

module.exports = router;
