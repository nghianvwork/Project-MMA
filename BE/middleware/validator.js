// Middleware validate dữ liệu thuốc
const validateMedicine = (req, res, next) => {
  const { name } = req.body;
  
  if (!name || name.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Tên thuốc không được để trống'
    });
  }
  
  next();
};

// Middleware validate dữ liệu lịch uống thuốc
const validateSchedule = (req, res, next) => {
  const { medicine_id, start_date, time_of_day, rule_type } = req.body;
  
  // Kiểm tra các trường bắt buộc
  if (!medicine_id) {
    return res.status(400).json({
      success: false,
      message: 'medicine_id không được để trống'
    });
  }
  
  if (!start_date) {
    return res.status(400).json({
      success: false,
      message: 'start_date không được để trống'
    });
  }
  
  if (!time_of_day) {
    return res.status(400).json({
      success: false,
      message: 'time_of_day không được để trống'
    });
  }
  
  if (!rule_type) {
    return res.status(400).json({
      success: false,
      message: 'rule_type không được để trống'
    });
  }
  
  // Validate format ngày
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(start_date)) {
    return res.status(400).json({
      success: false,
      message: 'start_date phải có định dạng YYYY-MM-DD'
    });
  }
  
  // Validate format giờ
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
  if (!timeRegex.test(time_of_day)) {
    return res.status(400).json({
      success: false,
      message: 'time_of_day phải có định dạng HH:MM:SS'
    });
  }
  
  next();
};

module.exports = { validateMedicine, validateSchedule };
