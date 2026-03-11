const db = require("../config/database");

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

const getNotificationSettings = async (req, res) => {
  try {
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
  getNotificationSettings,
  updateNotificationSettings,
};
