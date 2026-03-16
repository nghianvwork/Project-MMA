-- Bảng lưu Expo Push Token
CREATE TABLE IF NOT EXISTS PushTokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  expo_push_token VARCHAR(255) NOT NULL,
  device_id VARCHAR(255) DEFAULT NULL,
  platform VARCHAR(20) DEFAULT NULL COMMENT 'ios, android',
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_device (user_id, device_id),
  UNIQUE KEY unique_token (expo_push_token),
  INDEX idx_user_id (user_id),
  INDEX idx_active (is_active)
);

-- Bảng lưu lịch sử push notification đã gửi
CREATE TABLE IF NOT EXISTS PushNotificationLogs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT,
  type ENUM('schedule_reminder', 'low_stock', 'family_alert', 'system') DEFAULT 'system',
  reference_id INT DEFAULT NULL COMMENT 'ID của schedule hoặc medicine liên quan',
  status ENUM('sent', 'failed', 'filtered') DEFAULT 'sent',
  error_message TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_type (type),
  INDEX idx_created_at (created_at)
);
