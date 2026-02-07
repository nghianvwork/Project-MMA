const db = require('../config/database');

// Lấy danh sách thuốc của user
const getMedicines = async (req, res) => {
  try {
    const userId = req.userId;
    const { search, sortBy = 'created_at', order = 'DESC' } = req.query;
    
    let query = 'SELECT * FROM Medicines WHERE user_id = ?';
    const params = [userId];
    
    // Tìm kiếm theo tên thuốc
    if (search) {
      query += ' AND name LIKE ?';
      params.push(`%${search}%`);
    }
    
    // Sắp xếp
    const allowedSortFields = ['name', 'created_at', 'stock_quantity'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    query += ` ORDER BY ${sortField} ${sortOrder}`;
    
    const [medicines] = await db.query(query, params);
    
    res.json({
      success: true,
      data: medicines,
      total: medicines.length
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách thuốc:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách thuốc',
      error: error.message
    });
  }
};

// Lấy chi tiết một thuốc
const getMedicineById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    
    const [medicines] = await db.query(
      'SELECT * FROM Medicines WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (medicines.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thuốc'
      });
    }
    
    res.json({
      success: true,
      data: medicines[0]
    });
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết thuốc:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy chi tiết thuốc',
      error: error.message
    });
  }
};

// Thêm thuốc mới
const createMedicine = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      name,
      barcode,
      dosage,
      form,
      note,
      stock_quantity,
      stock_unit,
      low_stock_threshold
    } = req.body;
    
    const [result] = await db.query(
      `INSERT INTO Medicines 
       (user_id, name, barcode, dosage, form, note, stock_quantity, stock_unit, low_stock_threshold) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        name,
        barcode || null,
        dosage || null,
        form || null,
        note || null,
        stock_quantity || 0,
        stock_unit || null,
        low_stock_threshold || 5
      ]
    );
    
    // Lấy thông tin thuốc vừa tạo
    const [newMedicine] = await db.query(
      'SELECT * FROM Medicines WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json({
      success: true,
      message: 'Thêm thuốc thành công',
      data: newMedicine[0]
    });
  } catch (error) {
    console.error('Lỗi khi thêm thuốc:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi thêm thuốc',
      error: error.message
    });
  }
};

// Cập nhật thông tin thuốc
const updateMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const {
      name,
      barcode,
      dosage,
      form,
      note,
      stock_quantity,
      stock_unit,
      low_stock_threshold
    } = req.body;
    
    // Kiểm tra thuốc có tồn tại và thuộc về user không
    const [existing] = await db.query(
      'SELECT * FROM Medicines WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thuốc hoặc bạn không có quyền chỉnh sửa'
      });
    }
    
    // Cập nhật
    await db.query(
      `UPDATE Medicines 
       SET name = ?, barcode = ?, dosage = ?, form = ?, note = ?, 
           stock_quantity = ?, stock_unit = ?, low_stock_threshold = ?
       WHERE id = ? AND user_id = ?`,
      [
        name,
        barcode || null,
        dosage || null,
        form || null,
        note || null,
        stock_quantity !== undefined ? stock_quantity : existing[0].stock_quantity,
        stock_unit || null,
        low_stock_threshold !== undefined ? low_stock_threshold : existing[0].low_stock_threshold,
        id,
        userId
      ]
    );
    
    // Lấy thông tin thuốc sau khi cập nhật
    const [updatedMedicine] = await db.query(
      'SELECT * FROM Medicines WHERE id = ?',
      [id]
    );
    
    res.json({
      success: true,
      message: 'Cập nhật thuốc thành công',
      data: updatedMedicine[0]
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật thuốc:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật thuốc',
      error: error.message
    });
  }
};

// Xóa thuốc
const deleteMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    
    // Kiểm tra thuốc có tồn tại và thuộc về user không
    const [existing] = await db.query(
      'SELECT * FROM Medicines WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thuốc hoặc bạn không có quyền xóa'
      });
    }
    
    // Kiểm tra xem thuốc có đang được sử dụng trong lịch uống thuốc không
    const [schedules] = await db.query(
      'SELECT COUNT(*) as count FROM Schedules WHERE medicine_id = ?',
      [id]
    );
    
    if (schedules[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa thuốc đang có lịch uống. Vui lòng xóa lịch uống trước.'
      });
    }
    
    // Xóa thuốc
    await db.query('DELETE FROM Medicines WHERE id = ? AND user_id = ?', [id, userId]);
    
    res.json({
      success: true,
      message: 'Xóa thuốc thành công'
    });
  } catch (error) {
    console.error('Lỗi khi xóa thuốc:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa thuốc',
      error: error.message
    });
  }
};

// Cập nhật số lượng tồn kho
const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { stock_quantity } = req.body;
    
    if (stock_quantity === undefined || stock_quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Số lượng tồn kho không hợp lệ'
      });
    }
    
    const [existing] = await db.query(
      'SELECT * FROM Medicines WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thuốc'
      });
    }
    
    await db.query(
      'UPDATE Medicines SET stock_quantity = ? WHERE id = ? AND user_id = ?',
      [stock_quantity, id, userId]
    );
    
    const [updated] = await db.query('SELECT * FROM Medicines WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Cập nhật tồn kho thành công',
      data: updated[0]
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật tồn kho:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật tồn kho',
      error: error.message
    });
  }
};

// Lấy danh sách thuốc sắp hết
const getLowStockMedicines = async (req, res) => {
  try {
    const userId = req.userId;
    
    const [medicines] = await db.query(
      'SELECT * FROM Medicines WHERE user_id = ? AND stock_quantity <= low_stock_threshold ORDER BY stock_quantity ASC',
      [userId]
    );
    
    res.json({
      success: true,
      data: medicines,
      total: medicines.length
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách thuốc sắp hết:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

module.exports = {
  getMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  updateStock,
  getLowStockMedicines
};
