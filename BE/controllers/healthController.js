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

const getHealthRecords = async (req, res) => {
  try {
    const userId = req.userId;
    const { member_id, category } = req.query;

    let query = "SELECT * FROM HealthRecords WHERE user_id = ?";
    const params = [userId];

    if (member_id) {
      query += " AND member_id = ?";
      params.push(member_id);
    }

    if (category) {
      query += " AND category = ?";
      params.push(category);
    }

    query += " ORDER BY created_at DESC";

    const [records] = await db.query(query, params);

    res.json({ success: true, data: records, total: records.length });
  } catch (error) {
    console.error("Lỗi khi lấy hồ sơ sức khỏe:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy hồ sơ sức khỏe",
      error: error.message,
    });
  }
};

const createHealthRecord = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      member_id,
      category,
      title,
      description,
      diagnosed_date,
      hospital,
      severity,
    } = req.body;

    if (!category || !title) {
      return res
        .status(400)
        .json({ success: false, message: "category và title là bắt buộc" });
    }

    const hasMember = await ensureMemberOwnership(member_id, userId);
    if (!hasMember) {
      return res.status(400).json({ success: false, message: "member_id không hợp lệ" });
    }

    const [result] = await db.query(
      `INSERT INTO HealthRecords
      (user_id, member_id, category, title, description, diagnosed_date, hospital, severity)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        member_id || null,
        category,
        title,
        description || null,
        diagnosed_date || null,
        hospital || null,
        severity || null,
      ]
    );

    const [records] = await db.query("SELECT * FROM HealthRecords WHERE id = ?", [
      result.insertId,
    ]);

    res.status(201).json({
      success: true,
      message: "Tạo hồ sơ sức khỏe thành công",
      data: records[0],
    });
  } catch (error) {
    console.error("Lỗi khi tạo hồ sơ sức khỏe:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi tạo hồ sơ sức khỏe",
      error: error.message,
    });
  }
};

const updateHealthRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const {
      member_id,
      category,
      title,
      description,
      diagnosed_date,
      hospital,
      severity,
    } = req.body;

    const [existing] = await db.query(
      "SELECT * FROM HealthRecords WHERE id = ? AND user_id = ?",
      [id, userId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy hồ sơ" });
    }

    const hasMember = await ensureMemberOwnership(member_id || existing[0].member_id, userId);
    if (!hasMember) {
      return res.status(400).json({ success: false, message: "member_id không hợp lệ" });
    }

    await db.query(
      `UPDATE HealthRecords
       SET member_id = ?, category = ?, title = ?, description = ?, diagnosed_date = ?, hospital = ?, severity = ?
       WHERE id = ? AND user_id = ?`,
      [
        member_id !== undefined ? member_id : existing[0].member_id,
        category || existing[0].category,
        title || existing[0].title,
        description !== undefined ? description : existing[0].description,
        diagnosed_date !== undefined ? diagnosed_date : existing[0].diagnosed_date,
        hospital !== undefined ? hospital : existing[0].hospital,
        severity !== undefined ? severity : existing[0].severity,
        id,
        userId,
      ]
    );

    const [records] = await db.query("SELECT * FROM HealthRecords WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "Cập nhật hồ sơ sức khỏe thành công",
      data: records[0],
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật hồ sơ sức khỏe:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật hồ sơ sức khỏe",
      error: error.message,
    });
  }
};

const deleteHealthRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const [existing] = await db.query(
      "SELECT * FROM HealthRecords WHERE id = ? AND user_id = ?",
      [id, userId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy hồ sơ" });
    }

    await db.query("DELETE FROM HealthRecords WHERE id = ? AND user_id = ?", [id, userId]);

    res.json({ success: true, message: "Xóa hồ sơ sức khỏe thành công" });
  } catch (error) {
    console.error("Lỗi khi xóa hồ sơ sức khỏe:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa hồ sơ sức khỏe",
      error: error.message,
    });
  }
};

module.exports = {
  getHealthRecords,
  createHealthRecord,
  updateHealthRecord,
  deleteHealthRecord,
};
