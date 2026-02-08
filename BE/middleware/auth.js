// Middleware xác thực user (đơn giản, có thể tích hợp Firebase Auth sau)
const authenticateUser = (req, res, next) => {
  const userId = req.headers['x-user-id'];
  
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Thiếu thông tin xác thực. Vui lòng đăng nhập.'
    });
  }
  
  req.userId = userId;
  next();
};

module.exports = { authenticateUser };
