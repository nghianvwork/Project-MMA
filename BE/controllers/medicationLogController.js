const db = require("../config/database");

const ensureMemberOwnership = async (memberId, userId) => {
  if (!memberId) {
    return true;
  }
  const [members] = await db.query(
    "SELECT id FROM FamilyMembers WHERE id = ? AND user_id = ?",
    [memberId, userId]
  );
  return members.length > 0;
};

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
    const { member_id, status, from, to } = req.query;

    let query = "SELECT * FROM MedicationLogs WHERE user_id = ?";
    const params = [userId];

    if (member_id) {
      query += " AND member_id = ?";
      params.push(member_id);
    }

    if (status) {
      query += " AND status = ?";
      params.push(status);
    }

    if (from) {
      query += " AND planned_time >= ?";
      params.push(from);
    }

    if (to) {
      query += " AND planned_time <= ?";
      params.push(to);
    }

    query += " ORDER BY planned_time DESC";

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
    const {
      member_id,
      schedule_id,
      medicine_id,
      planned_time,
      taken_time,
      status,
      note,
    } = req.body;

    if (!medicine_id || !planned_time) {
      return res
        .status(400)
        .json({ success: false, message: "medicine_id và planned_time là bắt buộc" });
    }

    const hasMember = await ensureMemberOwnership(member_id, userId);
    if (!hasMember) {
      return res.status(400).json({ success: false, message: "member_id không hợp lệ" });
    }

    const hasMedicine = await ensureMedicineOwnership(medicine_id, userId);
    if (!hasMedicine) {
      return res.status(400).json({ success: false, message: "medicine_id không hợp lệ" });
    }

    const hasSchedule = await ensureScheduleOwnership(schedule_id, userId);
    if (!hasSchedule) {
      return res.status(400).json({ success: false, message: "schedule_id không hợp lệ" });
    }

    const [result] = await db.query(
      `INSERT INTO MedicationLogs
      (user_id, member_id, schedule_id, medicine_id, planned_time, taken_time, status, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        member_id || null,
        schedule_id || null,
        medicine_id,
        planned_time,
        taken_time || null,
        status || "taken",
        note || null,
      ]
    );

    const [logs] = await db.query("SELECT * FROM MedicationLogs WHERE id = ?", [
      result.insertId,
    ]);

    res.status(201).json({
      success: true,
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
    const { member_id, schedule_id, medicine_id, planned_time, taken_time, status, note } =
      req.body;

    const [existing] = await db.query(
      "SELECT * FROM MedicationLogs WHERE id = ? AND user_id = ?",
      [id, userId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy lịch sử" });
    }

    const targetMemberId = member_id !== undefined ? member_id : existing[0].member_id;
    const hasMember = await ensureMemberOwnership(targetMemberId, userId);
    if (!hasMember) {
      return res.status(400).json({ success: false, message: "member_id không hợp lệ" });
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
      `UPDATE MedicationLogs
       SET member_id = ?, schedule_id = ?, medicine_id = ?, planned_time = ?, taken_time = ?, status = ?, note = ?
       WHERE id = ? AND user_id = ?`,
      [
        targetMemberId,
        targetScheduleId,
        targetMedicineId,
        planned_time || existing[0].planned_time,
        taken_time !== undefined ? taken_time : existing[0].taken_time,
        status || existing[0].status,
        note !== undefined ? note : existing[0].note,
        id,
        userId,
      ]
    );

    const [logs] = await db.query("SELECT * FROM MedicationLogs WHERE id = ?", [id]);

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

    const [existing] = await db.query(
      "SELECT id FROM MedicationLogs WHERE id = ? AND user_id = ?",
      [id, userId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy lịch sử" });
    }

    await db.query("DELETE FROM MedicationLogs WHERE id = ? AND user_id = ?", [id, userId]);
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
    const { member_id, from, to } = req.query;

    let query = "SELECT status, COUNT(*) as count FROM MedicationLogs WHERE user_id = ?";
    const params = [userId];

    if (member_id) {
      query += " AND member_id = ?";
      params.push(member_id);
    }

    if (from) {
      query += " AND planned_time >= ?";
      params.push(from);
    }

    if (to) {
      query += " AND planned_time <= ?";
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
      (summary.by_status.taken || 0) + (summary.by_status.late || 0);
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
