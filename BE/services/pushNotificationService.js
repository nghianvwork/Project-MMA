const db = require("../config/database");

const EXPO_PUSH_API = "https://exp.host/--/api/v2/push/send";

/**
 * Gửi push notification qua Expo Push API
 * @param {Array} pushMessages - Mảng các message theo format Expo
 * @returns {Promise<Array>} - Kết quả gửi
 */
const sendPushNotifications = async (pushMessages) => {
  if (!pushMessages || pushMessages.length === 0) return [];

  // Expo cho phép gửi tối đa 100 messages mỗi request
  const chunks = [];
  for (let i = 0; i < pushMessages.length; i += 100) {
    chunks.push(pushMessages.slice(i, i + 100));
  }

  const results = [];
  for (const chunk of chunks) {
    try {
      const response = await fetch(EXPO_PUSH_API, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chunk),
      });

      const data = await response.json();
      if (data.data) {
        results.push(...data.data);
      }
    } catch (error) {
      console.error("Lỗi gửi push notification:", error.message);
    }
  }

  return results;
};

/**
 * Gửi notification đến một user cụ thể
 */
const sendToUser = async (userId, title, body, data = {}, type = "system", referenceId = null) => {
  try {
    // Lấy tất cả push token active của user
    const [tokens] = await db.query(
      "SELECT expo_push_token FROM PushTokens WHERE user_id = ? AND is_active = 1",
      [userId]
    );

    if (tokens.length === 0) return;

    // Kiểm tra notification settings
    const [settings] = await db.query(
      "SELECT * FROM NotificationSettings WHERE user_id = ?",
      [userId]
    );

    const userSettings = settings[0] || {};

    // Kiểm tra quiet hours
    if (userSettings.quiet_hours_enabled) {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:00`;
      const quietStart = userSettings.quiet_start || "22:00:00";
      const quietEnd = userSettings.quiet_end || "06:00:00";

      if (quietStart > quietEnd) {
        // Qua đêm: 22:00 -> 06:00
        if (currentTime >= quietStart || currentTime < quietEnd) {
          await logNotification(userId, title, body, type, referenceId, "filtered");
          return;
        }
      } else {
        if (currentTime >= quietStart && currentTime < quietEnd) {
          await logNotification(userId, title, body, type, referenceId, "filtered");
          return;
        }
      }
    }

    // Kiểm tra loại notification có được bật không
    if (type === "schedule_reminder" && userSettings.remind_medicine === 0) return;
    if (type === "low_stock" && userSettings.low_stock_alert === 0) return;
    if (type === "family_alert" && userSettings.family_alert === 0) return;
    if (type === "system" && userSettings.system_alert === 0) return;

    const pushMessages = tokens.map((t) => ({
      to: t.expo_push_token,
      sound: userSettings.sound !== 0 ? "default" : undefined,
      title,
      body,
      data: { ...data, type },
    }));

    const results = await sendPushNotifications(pushMessages);

    // Log kết quả
    const allOk = results.every((r) => r.status === "ok");
    await logNotification(
      userId,
      title,
      body,
      type,
      referenceId,
      allOk ? "sent" : "failed",
      allOk ? null : JSON.stringify(results.filter((r) => r.status === "error"))
    );

    // Deactivate invalid tokens
    for (let i = 0; i < results.length; i++) {
      if (results[i].status === "error" && results[i].details?.error === "DeviceNotRegistered") {
        await db.query(
          "UPDATE PushTokens SET is_active = 0 WHERE expo_push_token = ?",
          [tokens[i].expo_push_token]
        );
      }
    }
  } catch (error) {
    console.error(`Lỗi gửi notification cho user ${userId}:`, error.message);
  }
};

/**
 * Log notification vào DB
 */
const logNotification = async (userId, title, body, type, referenceId, status, errorMessage = null) => {
  try {
    await db.query(
      `INSERT INTO PushNotificationLogs (user_id, title, body, type, reference_id, status, error_message)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, title, body, type, referenceId, status, errorMessage]
    );
  } catch (error) {
    console.error("Lỗi log notification:", error.message);
  }
};

/**
 * Kiểm tra schedules sắp đến và gửi push notification
 * Chạy mỗi phút
 */
const checkUpcomingSchedules = async () => {
  try {
    const now = new Date();
    const currentDate = now.toISOString().split("T")[0]; // YYYY-MM-DD
    const dayOfWeek = now.getDay(); // 0=Sunday

    // Lấy thời gian hiện tại + 5 phút để nhắc trước
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:00`;

    // Tìm schedules cần nhắc (đúng giờ time_of_day hiện tại)
    const [schedules] = await db.query(
      `SELECT s.*, m.name AS medicine_name, m.dosage, m.form
       FROM Schedules s
       JOIN Medicines m ON s.medicine_id = m.id
       WHERE s.start_date <= ?
         AND (s.end_date IS NULL OR s.end_date >= ?)
         AND s.time_of_day = ?`,
      [currentDate, currentDate, currentTime]
    );

    for (const schedule of schedules) {
      // Kiểm tra rule_type
      let shouldNotify = false;

      if (schedule.rule_type === "daily") {
        shouldNotify = true;
      } else if (schedule.rule_type === "every_x_days") {
        const startDate = new Date(schedule.start_date);
        const diffDays = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
        shouldNotify = diffDays % (schedule.interval_days || 1) === 0;
      } else if (schedule.rule_type === "weekdays") {
        const weekdays = (schedule.weekdays || "").split(",").map(Number);
        shouldNotify = weekdays.includes(dayOfWeek);
      }

      if (!shouldNotify) continue;

      // Kiểm tra đã gửi notification cho schedule này hôm nay chưa
      const [existing] = await db.query(
        `SELECT id FROM PushNotificationLogs
         WHERE user_id = ? AND type = 'schedule_reminder' AND reference_id = ?
           AND DATE(created_at) = ?`,
        [schedule.user_id, schedule.id, currentDate]
      );

      if (existing.length > 0) continue;

      const doseInfo = schedule.dose_amount ? ` - ${schedule.dose_amount} ${schedule.form || ""}` : "";
      await sendToUser(
        schedule.user_id,
        `⏰ Đến giờ uống thuốc!`,
        `${schedule.medicine_name} ${schedule.dosage || ""}${doseInfo}`,
        { scheduleId: schedule.id, medicineId: schedule.medicine_id },
        "schedule_reminder",
        schedule.id
      );
    }

    console.log(`[CRON] Checked schedules at ${now.toISOString()} - Found ${schedules.length} matching`);
  } catch (error) {
    console.error("[CRON] Lỗi check schedules:", error.message);
  }
};

/**
 * Kiểm tra thuốc sắp hết và gửi push notification
 * Chạy mỗi giờ
 */
const checkLowStock = async () => {
  try {
    const [medicines] = await db.query(
      `SELECT id, user_id, name, stock_quantity, stock_unit, low_stock_threshold
       FROM Medicines
       WHERE stock_quantity <= low_stock_threshold AND stock_quantity > 0`
    );

    const today = new Date().toISOString().split("T")[0];

    for (const med of medicines) {
      // Kiểm tra đã gửi low-stock notification cho thuốc này hôm nay chưa
      const [existing] = await db.query(
        `SELECT id FROM PushNotificationLogs
         WHERE user_id = ? AND type = 'low_stock' AND reference_id = ?
           AND DATE(created_at) = ?`,
        [med.user_id, med.id, today]
      );

      if (existing.length > 0) continue;

      await sendToUser(
        med.user_id,
        `⚠️ Thuốc sắp hết!`,
        `${med.name} chỉ còn ${med.stock_quantity} ${med.stock_unit || "viên"}. Hãy bổ sung thêm.`,
        { medicineId: med.id },
        "low_stock",
        med.id
      );
    }

    console.log(`[CRON] Checked low stock at ${new Date().toISOString()} - Found ${medicines.length} low-stock items`);
  } catch (error) {
    console.error("[CRON] Lỗi check low stock:", error.message);
  }
};

module.exports = {
  sendPushNotifications,
  sendToUser,
  checkUpcomingSchedules,
  checkLowStock,
};
