-- =====================================================
-- DATABASE SCHEMA FOR MEDICINE MANAGEMENT API
-- =====================================================

-- Drop tables if exists (để tránh lỗi khi chạy lại)
DROP TABLE IF EXISTS Schedules;
DROP TABLE IF EXISTS Medicines;
DROP TABLE IF EXISTS Users;

-- =====================================================
-- TABLE: Users
-- =====================================================
CREATE TABLE Users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    dob DATE,
    gender ENUM('Nam', 'Nữ', 'Khác'),
    photo_url TEXT,
    height_cm DECIMAL(5,2),
    weight_kg DECIMAL(5,2),
    reset_token VARCHAR(255),
    reset_token_expire DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_reset_token (reset_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: Medicines
-- =====================================================
CREATE TABLE Medicines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    barcode VARCHAR(100),
    dosage VARCHAR(100),
    form VARCHAR(50),
    note TEXT,
    stock_quantity INT DEFAULT 0,
    stock_unit VARCHAR(50),
    low_stock_threshold INT DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_name (name),
    INDEX idx_barcode (barcode),
    INDEX idx_stock (stock_quantity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: Schedules
-- =====================================================
CREATE TABLE Schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    medicine_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    time_of_day TIME NOT NULL,
    rule_type ENUM('daily', 'every_x_days', 'weekdays') NOT NULL DEFAULT 'daily',
    interval_days INT,
    weekdays VARCHAR(20),
    dose_amount DECIMAL(10,2) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (medicine_id) REFERENCES Medicines(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_medicine_id (medicine_id),
    INDEX idx_start_date (start_date),
    INDEX idx_end_date (end_date),
    INDEX idx_time_of_day (time_of_day)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Sample User (password: "123456")
-- INSERT INTO Users (id, email, password_hash, display_name, dob, gender) 
-- VALUES (
--     'sample-user-uuid-123',
--     'test@example.com',
--     '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
--     'Test User',
--     '1990-01-01',
--     'Nam'
-- );

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check tables created
SHOW TABLES;

-- Check Users table structure
DESCRIBE Users;

-- Check Medicines table structure
DESCRIBE Medicines;

-- Check Schedules table structure
DESCRIBE Schedules;

-- =====================================================
-- USEFUL QUERIES FOR MAINTENANCE
-- =====================================================

-- Count records in each table
-- SELECT 'Users' as table_name, COUNT(*) as count FROM Users
-- UNION ALL
-- SELECT 'Medicines', COUNT(*) FROM Medicines
-- UNION ALL
-- SELECT 'Schedules', COUNT(*) FROM Schedules;
