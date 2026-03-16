const db = require("../config/database");

let notificationSettingsTableEnsured = false;

// ===== PUSH TOKEN =====

const registerPushToken = async (req, res) => {
  try {
    const userId = req.userId;
    const { expo_push_token, device_id, platform } = req.body;

    if (!expo_push_token) {
      return res.status(400).json({
        success: false,
        message: "expo_push_token là bắt buộc",
      });
    }

    // Validate Expo push token format
    if (!expo_push_token.startsWith("ExponentPushToken[") && !expo_push_token.startsWith("ExpoPushToken[")) {
      return res.status(400).json({
        success: false,
        message: "expo_push_token không đúng format",
      });
    }

    // Upsert: nếu đã tồn tại token thì cập nhật user_id và active
    await db.query(
      `INSERT INTO PushTokens (user_id, expo_push_token, device_id, platform, is_active)
       VALUES (?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE
         user_id = VALUES(user_id),
         device_id = VALUES(device_id),
         platform = VALUES(platform),
         is_active = 1,
         updated_at = CURRENT_TIMESTAMP`,
      [userId, expo_push_token, device_id || null, platform || null]
    );

    res.json({
      success: true,
      message: "Đăng ký push token thành công",
    });
  } catch (error) {
    console.error("Lỗi đăng ký push token:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi đăng ký push token",
      error: error.message,
    });
  }
};

const removePushToken = async (req, res) => {
  try {
    const userId = req.userId;
    const { expo_push_token } = req.body;

    if (!expo_push_token) {
      return res.status(400).json({
        success: false,
        message: "expo_push_token là bắt buộc",
      });
    }

    await db.query(
      "UPDATE PushTokens SET is_active = 0 WHERE user_id = ? AND expo_push_token = ?",
      [userId, expo_push_token]
    );

    res.json({
      success: true,
      message: "Hủy đăng ký push token thành công",
    });
  } catch (error) {
    console.error("Lỗi hủy push token:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi hủy push token",
      error: error.message,
    });
  }
};

// ===== NOTIFICATION SETTINGS =====


const DEFAULT_SETTINGS = {
  remind_medicine: 1,
  sound: 1,
  vibrate: 1,
  low_stock_alert: 1,
  family_alert: 1,
  system_alert: 1,
  quiet_hours_enabled: 0,
  quiet_start: "22:00:00",
  quiet_end: "06:00:00",
};

const ensureNotificationSettingsTable = async () => {
  if (notificationSettingsTableEnsured) {
    return;
  }

  await db.query(`
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
    )
  `);

  notificationSettingsTableEnsured = true;
};

const getNotificationSettings = async (req, res) => {
  try {
    await ensureNotificationSettingsTable();
    const userId = req.userId;
    const [rows] = await db.query(
      "SELECT * FROM NotificationSettings WHERE user_id = ?",
      [userId]
    );

    if (rows.length === 0) {
      return res.json({ success: true, data: { user_id: userId, ...DEFAULT_SETTINGS } });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("Lỗi khi lấy cài đặt thông báo:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy cài đặt thông báo",
      error: error.message,
    });
  }
};

const updateNotificationSettings = async (req, res) => {
  try {
    await ensureNotificationSettingsTable();
    const userId = req.userId;
    const payload = {
      remind_medicine: req.body.remind_medicine,
      sound: req.body.sound,
      vibrate: req.body.vibrate,
      low_stock_alert: req.body.low_stock_alert,
      family_alert: req.body.family_alert,
      system_alert: req.body.system_alert,
      quiet_hours_enabled: req.body.quiet_hours_enabled,
      quiet_start: req.body.quiet_start,
      quiet_end: req.body.quiet_end,
    };

    const [existing] = await db.query(
      "SELECT * FROM NotificationSettings WHERE user_id = ?",
      [userId]
    );

    const merged = {
      ...DEFAULT_SETTINGS,
      ...(existing[0] || {}),
      ...Object.fromEntries(
        Object.entries(payload).filter(([, value]) => value !== undefined)
      ),
    };

    await db.query(
      `INSERT INTO NotificationSettings
      (user_id, remind_medicine, sound, vibrate, low_stock_alert, family_alert, system_alert, quiet_hours_enabled, quiet_start, quiet_end)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        remind_medicine = VALUES(remind_medicine),
        sound = VALUES(sound),
        vibrate = VALUES(vibrate),
        low_stock_alert = VALUES(low_stock_alert),
        family_alert = VALUES(family_alert),
        system_alert = VALUES(system_alert),
        quiet_hours_enabled = VALUES(quiet_hours_enabled),
        quiet_start = VALUES(quiet_start),
        quiet_end = VALUES(quiet_end)`,
      [
        userId,
        merged.remind_medicine ? 1 : 0,
        merged.sound ? 1 : 0,
        merged.vibrate ? 1 : 0,
        merged.low_stock_alert ? 1 : 0,
        merged.family_alert ? 1 : 0,
        merged.system_alert ? 1 : 0,
        merged.quiet_hours_enabled ? 1 : 0,
        merged.quiet_start,
        merged.quiet_end,
      ]
    );

    const [rows] = await db.query(
      "SELECT * FROM NotificationSettings WHERE user_id = ?",
      [userId]
    );

    res.json({
      success: true,
      message: "Cập nhật cài đặt thông báo thành công",
      data: rows[0] || { user_id: userId, ...merged },
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật cài đặt thông báo:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật cài đặt thông báo",
      error: error.message,
    });
  }
};

module.exports = {
  registerPushToken,
  removePushToken,
  getNotificationSettings,
  updateNotificationSettings,
};
