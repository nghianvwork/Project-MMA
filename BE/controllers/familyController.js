const db = require("../config/database");

const getFamilyMembers = async (req, res) => {
  try {
    const userId = req.userId;
    const [members] = await db.query(
      "SELECT * FROM FamilyMembers WHERE user_id = ? ORDER BY is_primary DESC, created_at ASC",
      [userId]
    );

    res.json({ success: true, data: members, total: members.length });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách hồ sơ gia đình:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách hồ sơ gia đình",
      error: error.message,
    });
  }
};

const getFamilyMemberById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const [members] = await db.query(
      "SELECT * FROM FamilyMembers WHERE id = ? AND user_id = ?",
      [id, userId]
    );

    if (members.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy hồ sơ" });
    }

    res.json({ success: true, data: members[0] });
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết hồ sơ gia đình:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy chi tiết hồ sơ gia đình",
      error: error.message,
    });
  }
};

const createFamilyMember = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      name,
      relation,
      dob,
      gender,
      blood_type,
      blood_pressure,
      height_cm,
      weight_kg,
      photo_url,
      is_primary,
    } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, message: "Tên không được để trống" });
    }

    if (is_primary) {
      await db.query("UPDATE FamilyMembers SET is_primary = 0 WHERE user_id = ?", [userId]);
    }

    const [result] = await db.query(
      `INSERT INTO FamilyMembers
      (user_id, name, relation, dob, gender, blood_type, blood_pressure, height_cm, weight_kg, photo_url, is_primary)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        name,
        relation || null,
        dob || null,
        gender || null,
        blood_type || null,
        blood_pressure || null,
        height_cm || null,
        weight_kg || null,
        photo_url || null,
        is_primary ? 1 : 0,
      ]
    );

    const [members] = await db.query("SELECT * FROM FamilyMembers WHERE id = ?", [
      result.insertId,
    ]);

    res.status(201).json({
      success: true,
      message: "Tạo hồ sơ gia đình thành công",
      data: members[0],
    });
  } catch (error) {
    console.error("Lỗi khi tạo hồ sơ gia đình:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi tạo hồ sơ gia đình",
      error: error.message,
    });
  }
};

const updateFamilyMember = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const {
      name,
      relation,
      dob,
      gender,
      blood_type,
      blood_pressure,
      height_cm,
      weight_kg,
      photo_url,
      is_primary,
    } = req.body;

    const [existing] = await db.query(
      "SELECT * FROM FamilyMembers WHERE id = ? AND user_id = ?",
      [id, userId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy hồ sơ" });
    }

    if (is_primary) {
      await db.query("UPDATE FamilyMembers SET is_primary = 0 WHERE user_id = ?", [userId]);
    }

    await db.query(
      `UPDATE FamilyMembers
       SET name = ?, relation = ?, dob = ?, gender = ?, blood_type = ?, blood_pressure = ?,
           height_cm = ?, weight_kg = ?, photo_url = ?, is_primary = ?
       WHERE id = ? AND user_id = ?`,
      [
        name || existing[0].name,
        relation || existing[0].relation,
        dob || existing[0].dob,
        gender || existing[0].gender,
        blood_type || existing[0].blood_type,
        blood_pressure || existing[0].blood_pressure,
        height_cm !== undefined ? height_cm : existing[0].height_cm,
        weight_kg !== undefined ? weight_kg : existing[0].weight_kg,
        photo_url || existing[0].photo_url,
        is_primary ? 1 : existing[0].is_primary,
        id,
        userId,
      ]
    );

    const [members] = await db.query("SELECT * FROM FamilyMembers WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "Cập nhật hồ sơ gia đình thành công",
      data: members[0],
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật hồ sơ gia đình:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật hồ sơ gia đình",
      error: error.message,
    });
  }
};

const deleteFamilyMember = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const [existing] = await db.query(
      "SELECT * FROM FamilyMembers WHERE id = ? AND user_id = ?",
      [id, userId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy hồ sơ" });
    }

    await db.query("DELETE FROM FamilyMembers WHERE id = ? AND user_id = ?", [id, userId]);

    res.json({ success: true, message: "Xóa hồ sơ gia đình thành công" });
  } catch (error) {
    console.error("Lỗi khi xóa hồ sơ gia đình:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa hồ sơ gia đình",
      error: error.message,
    });
  }
};

const setPrimaryMember = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const [existing] = await db.query(
      "SELECT * FROM FamilyMembers WHERE id = ? AND user_id = ?",
      [id, userId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy hồ sơ" });
    }

    await db.query("UPDATE FamilyMembers SET is_primary = 0 WHERE user_id = ?", [userId]);
    await db.query("UPDATE FamilyMembers SET is_primary = 1 WHERE id = ? AND user_id = ?", [
      id,
      userId,
    ]);

    const [members] = await db.query("SELECT * FROM FamilyMembers WHERE id = ?", [id]);
    res.json({ success: true, message: "Đã đặt hồ sơ chính", data: members[0] });
  } catch (error) {
    console.error("Lỗi khi đặt hồ sơ chính:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi đặt hồ sơ chính",
      error: error.message,
    });
  }
};

module.exports = {
  getFamilyMembers,
  getFamilyMemberById,
  createFamilyMember,
  updateFamilyMember,
  deleteFamilyMember,
  setPrimaryMember,
};
