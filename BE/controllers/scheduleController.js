const db = require('../config/database');

// Lấy danh sách lịch uống thuốc
const getSchedules = async (req, res) => {
  try {
    const userId = req.userId;
    const { date, medicine_id } = req.query;
    
    let query = `
      SELECT s.*, m.name as medicine_name, m.dosage, m.form, m.stock_quantity
      FROM Schedules s
      JOIN Medicines m ON s.medicine_id = m.id
      WHERE s.user_id = ?
    `;
    const params = [userId];
    
    // Lọc theo thuốc
    if (medicine_id) {
      query += ' AND s.medicine_id = ?';
      params.push(medicine_id);
    }
    
    // Lọc theo ngày (lấy lịch còn hiệu lực)
    if (date) {
      query += ' AND s.start_date <= ? AND (s.end_date IS NULL OR s.end_date >= ?)';
      params.push(date, date);
    }
    
    query += ' ORDER BY s.time_of_day ASC';
    
    const [schedules] = await db.query(query, params);
    
    res.json({
      success: true,
      data: schedules,
      total: schedules.length
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách lịch:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách lịch',
      error: error.message
    });
  }
};

// Lấy chi tiết một lịch
const getScheduleById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    
    const [schedules] = await db.query(
      `SELECT s.*, m.name as medicine_name, m.dosage, m.form
       FROM Schedules s
       JOIN Medicines m ON s.medicine_id = m.id
       WHERE s.id = ? AND s.user_id = ?`,
      [id, userId]
    );
    
    if (schedules.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch uống thuốc'
      });
    }
    
    res.json({
      success: true,
      data: schedules[0]
    });
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết lịch:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// Tạo lịch uống thuốc mới (thêm thuốc vào lịch)
const createSchedule = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      medicine_id,
      start_date,
      end_date,
      time_of_day,
      rule_type,
      interval_days,
      weekdays,
      dose_amount
    } = req.body;
    
    // Kiểm tra thuốc có tồn tại và thuộc về user không
    const [medicines] = await db.query(
      'SELECT * FROM Medicines WHERE id = ? AND user_id = ?',
      [medicine_id, userId]
    );
    
    if (medicines.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thuốc hoặc bạn không có quyền'
      });
    }
    
    // Validate rule_type
    const validRuleTypes = ['daily', 'every_x_days', 'weekdays'];
    if (!validRuleTypes.includes(rule_type)) {
      return res.status(400).json({
        success: false,
        message: 'rule_type không hợp lệ. Chỉ chấp nhận: daily, every_x_days, weekdays'
      });
    }
    
    // Validate interval_days cho rule_type = every_x_days
    if (rule_type === 'every_x_days' && (!interval_days || interval_days < 1)) {
      return res.status(400).json({
        success: false,
        message: 'interval_days phải lớn hơn 0 khi rule_type là every_x_days'
      });
    }
    
    // Validate weekdays cho rule_type = weekdays
    if (rule_type === 'weekdays' && !weekdays) {
      return res.status(400).json({
        success: false,
        message: 'weekdays không được để trống khi rule_type là weekdays'
      });
    }
    
    const [result] = await db.query(
      `INSERT INTO Schedules 
       (user_id, medicine_id, start_date, end_date, time_of_day, rule_type, interval_days, weekdays, dose_amount) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        medicine_id,
        start_date,
        end_date || null,
        time_of_day,
        rule_type,
        interval_days || null,
        weekdays || null,
        dose_amount || 1
      ]
    );
    
    // Lấy thông tin lịch vừa tạo
    const [newSchedule] = await db.query(
      `SELECT s.*, m.name as medicine_name, m.dosage, m.form
       FROM Schedules s
       JOIN Medicines m ON s.medicine_id = m.id
       WHERE s.id = ?`,
      [result.insertId]
    );
    
    res.status(201).json({
      success: true,
      message: 'Tạo lịch uống thuốc thành công',
      data: newSchedule[0]
    });
  } catch (error) {
    console.error('Lỗi khi tạo lịch:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo lịch',
      error: error.message
    });
  }
};

// Cập nhật lịch uống thuốc
const updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const {
      medicine_id,
      start_date,
      end_date,
      time_of_day,
      rule_type,
      interval_days,
      weekdays,
      dose_amount
    } = req.body;
    
    // Kiểm tra lịch có tồn tại không
    const [existing] = await db.query(
      'SELECT * FROM Schedules WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch hoặc bạn không có quyền'
      });
    }
    
    // Nếu thay đổi medicine_id, kiểm tra thuốc mới
    if (medicine_id && medicine_id !== existing[0].medicine_id) {
      const [medicines] = await db.query(
        'SELECT * FROM Medicines WHERE id = ? AND user_id = ?',
        [medicine_id, userId]
      );
      
      if (medicines.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thuốc mới'
        });
      }
    }
    
    await db.query(
      `UPDATE Schedules 
       SET medicine_id = ?, start_date = ?, end_date = ?, time_of_day = ?, 
           rule_type = ?, interval_days = ?, weekdays = ?, dose_amount = ?
       WHERE id = ? AND user_id = ?`,
      [
        medicine_id || existing[0].medicine_id,
        start_date || existing[0].start_date,
        end_date !== undefined ? end_date : existing[0].end_date,
        time_of_day || existing[0].time_of_day,
        rule_type || existing[0].rule_type,
        interval_days !== undefined ? interval_days : existing[0].interval_days,
        weekdays !== undefined ? weekdays : existing[0].weekdays,
        dose_amount !== undefined ? dose_amount : existing[0].dose_amount,
        id,
        userId
      ]
    );
    
    // Lấy thông tin sau khi cập nhật
    const [updated] = await db.query(
      `SELECT s.*, m.name as medicine_name, m.dosage, m.form
       FROM Schedules s
       JOIN Medicines m ON s.medicine_id = m.id
       WHERE s.id = ?`,
      [id]
    );
    
    res.json({
      success: true,
      message: 'Cập nhật lịch thành công',
      data: updated[0]
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật lịch:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// Xóa lịch uống thuốc
const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    
    const [existing] = await db.query(
      'SELECT * FROM Schedules WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch hoặc bạn không có quyền'
      });
    }
    
    await db.query('DELETE FROM Schedules WHERE id = ? AND user_id = ?', [id, userId]);
    
    res.json({
      success: true,
      message: 'Xóa lịch thành công'
    });
  } catch (error) {
    console.error('Lỗi khi xóa lịch:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// Lấy lịch uống thuốc theo ngày cụ thể (với tính toán rule)
const getSchedulesByDate = async (req, res) => {
  try {
    const userId = req.userId;
    const { date } = req.params; // Format: YYYY-MM-DD
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ngày'
      });
    }
    
    // Lấy tất cả lịch còn hiệu lực tại ngày này
    const [schedules] = await db.query(
      `SELECT s.*, m.name as medicine_name, m.dosage, m.form, m.stock_quantity
       FROM Schedules s
       JOIN Medicines m ON s.medicine_id = m.id
       WHERE s.user_id = ? 
         AND s.start_date <= ?
         AND (s.end_date IS NULL OR s.end_date >= ?)
       ORDER BY s.time_of_day ASC`,
      [userId, date, date]
    );
    
    // Lọc theo rule
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 1 = Monday, ...
    
    const filteredSchedules = schedules.filter(schedule => {
      if (schedule.rule_type === 'daily') {
        return true;
      }
      
      if (schedule.rule_type === 'every_x_days') {
        const startDate = new Date(schedule.start_date);
        const diffTime = targetDate - startDate;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return diffDays % schedule.interval_days === 0;
      }
      
      if (schedule.rule_type === 'weekdays') {
        const weekdaysArray = schedule.weekdays.split(',').map(d => parseInt(d));
        return weekdaysArray.includes(dayOfWeek);
      }
      
      return false;
    });
    
    res.json({
      success: true,
      date: date,
      data: filteredSchedules,
      total: filteredSchedules.length
    });
  } catch (error) {
    console.error('Lỗi khi lấy lịch theo ngày:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

module.exports = {
  getSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getSchedulesByDate
};
