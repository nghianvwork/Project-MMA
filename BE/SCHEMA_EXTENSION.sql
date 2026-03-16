-- Schema extensions for family profiles, health records, medication logs, notifications, access grants

CREATE TABLE IF NOT EXISTS FamilyMembers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  relation VARCHAR(30) NULL,
  dob DATE NULL,
  gender VARCHAR(10) NULL,
  blood_type VARCHAR(5) NULL,
  blood_pressure VARCHAR(20) NULL,
  height_cm DECIMAL(6,2) NULL,
  weight_kg DECIMAL(6,2) NULL,
  photo_url VARCHAR(255) NULL,
  is_primary TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS HealthRecords (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  member_id INT NULL,
  category VARCHAR(30) NOT NULL, -- underlying | allergy | surgery
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  diagnosed_date DATE NULL,
  hospital VARCHAR(255) NULL,
  severity VARCHAR(50) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_health_user (user_id),
  INDEX idx_health_member (member_id),
  INDEX idx_health_category (category)
);

CREATE TABLE IF NOT EXISTS MedicationLogs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  member_id INT NULL,
  schedule_id INT NULL,
  medicine_id INT NOT NULL,
  planned_time DATETIME NOT NULL,
  taken_time DATETIME NULL,
  status VARCHAR(20) DEFAULT 'taken',
  note VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_logs_user (user_id),
  INDEX idx_logs_member (member_id),
  INDEX idx_logs_medicine (medicine_id),
  INDEX idx_logs_time (planned_time)
);

CREATE TABLE IF NOT EXISTS NotificationSettings (
  user_id VARCHAR(36) PRIMARY KEY,
  remind_medicine TINYINT(1) DEFAULT 1,
  sound TINYINT(1) DEFAULT 1,
  vibrate TINYINT(1) DEFAULT 1,
  low_stock_alert TINYINT(1) DEFAULT 1,
  family_alert TINYINT(1) DEFAULT 1,
  system_alert TINYINT(1) DEFAULT 1,
  quiet_hours_enabled TINYINT(1) DEFAULT 0,
  quiet_start TIME DEFAULT '22:00:00',
  quiet_end TIME DEFAULT '06:00:00',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS DataAccessGrants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  member_id INT NOT NULL,
  grantee_email VARCHAR(255) NOT NULL,
  permission_level VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_grants_user (user_id),
  INDEX idx_grants_member (member_id)
);

-- Ensure barcode field exists for Medicines table on existing databases
ALTER TABLE Medicines
  ADD COLUMN IF NOT EXISTS barcode VARCHAR(100) NULL AFTER name;

CREATE INDEX IF NOT EXISTS idx_barcode ON Medicines (barcode);

-- Keep existing databases in sync with current HealthRecords definition
ALTER TABLE HealthRecords
  MODIFY COLUMN user_id VARCHAR(50) NOT NULL;

CREATE INDEX IF NOT EXISTS idx_health_category ON HealthRecords (category);
