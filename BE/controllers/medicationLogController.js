const db = require("../config/database");

const ensureMedicineOwnership = async (medicineId, userId) => {
  const [medicines] = await db.query(
    "SELECT id FROM Medicines WHERE id = ? AND user_id = ?",
    [medicineId, userId]
  );
  return medicines.length > 0;
};

const ensureScheduleOwnership = async (scheduleId, userId) => {
  if (!scheduleId) {
    return true;
  }
  const [schedules] = await db.query(
    "SELECT id FROM Schedules WHERE id = ? AND user_id = ?",
    [scheduleId, userId]
  );
  return schedules.length > 0;
};

const getMedicationLogs = async (req, res) => {
  try {
    const userId = req.userId;
    const { status, from, to, schedule_id, medicine_id } = req.query;

    let query = `
      SELECT ml.*, m.name AS medicine_name, m.dosage, m.form
      FROM Medication_Logs ml
      LEFT JOIN Medicines m ON m.id = ml.medicine_id
      WHERE ml.user_id = ?
    `;
    const params = [userId];

    if (status) {
      query += " AND ml.status = ?";
      params.push(status);
    }

    if (schedule_id) {
      query += " AND ml.schedule_id = ?";
      params.push(schedule_id);
    }

    if (medicine_id) {
      query += " AND ml.medicine_id = ?";
      params.push(medicine_id);
    }

    if (from) {
      query += " AND ml.scheduled_time >= ?";
      params.push(from);
    }

    if (to) {
      query += " AND ml.scheduled_time <= ?";
      params.push(to);
    }

    query += " ORDER BY ml.scheduled_time DESC";

    const [logs] = await db.query(query, params);
    res.json({ success: true, data: logs, total: logs.length });
  } catch (error) {
    console.error("Lỗi khi lấy lịch sử uống thuốc:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy lịch sử uống thuốc",
      error: error.message,
    });
  }
};

const createMedicationLog = async (req, res) => {
  try {
    const userId = req.userId;
    const { schedule_id, medicine_id, scheduled_time, taken_time, status, note, side_effect } =
      req.body;

    if (!schedule_id || !medicine_id || !scheduled_time) {
      return res
        .status(400)
        .json({ success: false, message: "schedule_id, medicine_id, scheduled_time là bắt buộc" });
    }

    const hasMedicine = await ensureMedicineOwnership(medicine_id, userId);
    if (!hasMedicine) {
      return res.status(400).json({ success: false, message: "medicine_id không hợp lệ" });
    }

    const hasSchedule = await ensureScheduleOwnership(schedule_id, userId);
    if (!hasSchedule) {
      return res.status(400).json({ success: false, message: "schedule_id không hợp lệ" });
    }

    if (schedule_id) {
      const [existingLogs] = await db.query(
        `SELECT ml.*, m.name AS medicine_name, m.dosage, m.form
         FROM Medication_Logs ml
         LEFT JOIN Medicines m ON m.id = ml.medicine_id
         WHERE ml.user_id = ?
           AND ml.schedule_id = ?
           AND DATE(ml.scheduled_time) = DATE(?)
         ORDER BY ml.id DESC
         LIMIT 1`,
        [userId, schedule_id, scheduled_time]
      );

      if (existingLogs.length > 0) {
        return res.json({
          success: true,
          created: false,
          message: "Lịch sử uống thuốc cho lịch này trong ngày đã tồn tại",
          data: existingLogs[0],
        });
      }
    }

    const [result] = await db.query(
      `INSERT INTO Medication_Logs
      (schedule_id, medicine_id, user_id, scheduled_time, taken_time, status, note, side_effect)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        schedule_id || null,
        medicine_id,
        userId,
        scheduled_time,
        taken_time || null,
        status || "taken_on_time",
        note || null,
        side_effect || null,
      ]
    );

    const [logs] = await db.query(
      `SELECT ml.*, m.name AS medicine_name, m.dosage, m.form
       FROM Medication_Logs ml
       LEFT JOIN Medicines m ON m.id = ml.medicine_id
       WHERE ml.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      created: true,
      message: "Tạo lịch sử uống thuốc thành công",
      data: logs[0],
    });
  } catch (error) {
    console.error("Lỗi khi tạo lịch sử uống thuốc:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi tạo lịch sử uống thuốc",
      error: error.message,
    });
  }
};

const updateMedicationLog = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const {
      schedule_id,
      medicine_id,
      scheduled_time,
      taken_time,
      status,
      note,
      side_effect,
    } = req.body;

    const [existing] = await db.query("SELECT * FROM Medication_Logs WHERE id = ? AND user_id = ?", [
      id,
      userId,
    ]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy lịch sử" });
    }

    const targetMedicineId = medicine_id !== undefined ? medicine_id : existing[0].medicine_id;
    const hasMedicine = await ensureMedicineOwnership(targetMedicineId, userId);
    if (!hasMedicine) {
      return res.status(400).json({ success: false, message: "medicine_id không hợp lệ" });
    }

    const targetScheduleId = schedule_id !== undefined ? schedule_id : existing[0].schedule_id;
    const hasSchedule = await ensureScheduleOwnership(targetScheduleId, userId);
    if (!hasSchedule) {
      return res.status(400).json({ success: false, message: "schedule_id không hợp lệ" });
    }

    await db.query(
      `UPDATE Medication_Logs
       SET schedule_id = ?, medicine_id = ?, scheduled_time = ?, taken_time = ?, status = ?, note = ?, side_effect = ?
       WHERE id = ? AND user_id = ?`,
      [
        targetScheduleId,
        targetMedicineId,
        scheduled_time || existing[0].scheduled_time,
        taken_time !== undefined ? taken_time : existing[0].taken_time,
        status || existing[0].status,
        note !== undefined ? note : existing[0].note,
        side_effect !== undefined ? side_effect : existing[0].side_effect,
        id,
        userId,
      ]
    );

    const [logs] = await db.query("SELECT * FROM Medication_Logs WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "Cập nhật lịch sử uống thuốc thành công",
      data: logs[0],
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật lịch sử uống thuốc:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật lịch sử uống thuốc",
      error: error.message,
    });
  }
};

const deleteMedicationLog = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const [existing] = await db.query("SELECT id FROM Medication_Logs WHERE id = ? AND user_id = ?", [
      id,
      userId,
    ]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy lịch sử" });
    }

    await db.query("DELETE FROM Medication_Logs WHERE id = ? AND user_id = ?", [id, userId]);
    res.json({ success: true, message: "Xóa lịch sử uống thuốc thành công" });
  } catch (error) {
    console.error("Lỗi khi xóa lịch sử uống thuốc:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa lịch sử uống thuốc",
      error: error.message,
    });
  }
};

const getMedicationSummary = async (req, res) => {
  try {
    const userId = req.userId;
    const { from, to } = req.query;

    let query = "SELECT status, COUNT(*) as count FROM Medication_Logs WHERE user_id = ?";
    const params = [userId];

    if (from) {
      query += " AND scheduled_time >= ?";
      params.push(from);
    }

    if (to) {
      query += " AND scheduled_time <= ?";
      params.push(to);
    }

    query += " GROUP BY status";

    const [rows] = await db.query(query, params);
    const summary = rows.reduce(
      (acc, row) => {
        acc.total += Number(row.count || 0);
        acc.by_status[row.status] = Number(row.count || 0);
        return acc;
      },
      { total: 0, by_status: {} }
    );

    const completed =
      (summary.by_status.taken_on_time || 0) + (summary.by_status.late || 0);
    const adherence = summary.total > 0 ? Math.round((completed / summary.total) * 100) : 0;

    res.json({
      success: true,
      data: {
        total: summary.total,
        adherence_percent: adherence,
        by_status: summary.by_status,
      },
    });
  } catch (error) {
    console.error("Lỗi khi lấy thống kê uống thuốc:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thống kê uống thuốc",
      error: error.message,
    });
  }
};

module.exports = {
  getMedicationLogs,
  createMedicationLog,
  updateMedicationLog,
  deleteMedicationLog,
  getMedicationSummary,
};
