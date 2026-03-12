const db = require("../config/database");

const getFamilyMembers = async (req, res) => {
  try {
    const userId = req.userId;
    const [members] = await db.query(
      `SELECT c.id, c.patient_user_id, c.caregiver_user_id, c.permission, c.created_at,
              u.email AS caregiver_email, u.display_name AS caregiver_name, u.photo_url
       FROM Caregivers c
       JOIN Users u ON u.id = c.caregiver_user_id
       WHERE c.patient_user_id = ?
       ORDER BY c.created_at DESC`,
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
      `SELECT c.id, c.patient_user_id, c.caregiver_user_id, c.permission, c.created_at,
              u.email AS caregiver_email, u.display_name AS caregiver_name, u.photo_url
       FROM Caregivers c
       JOIN Users u ON u.id = c.caregiver_user_id
       WHERE c.id = ? AND c.patient_user_id = ?`,
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
    const { caregiver_user_id, caregiver_email, permission } = req.body;

    let caregiverId = caregiver_user_id;
    if (!caregiverId && caregiver_email) {
      const [users] = await db.query("SELECT id FROM Users WHERE email = ?", [caregiver_email]);
      caregiverId = users[0]?.id;
    }

    if (!caregiverId) {
      return res.status(400).json({
        success: false,
        message: "Cần caregiver_user_id hoặc caregiver_email hợp lệ",
      });
    }

    const [result] = await db.query(
      `INSERT INTO Caregivers
      (patient_user_id, caregiver_user_id, permission)
      VALUES (?, ?, ?)`,
      [userId, caregiverId, permission || "view"]
    );

    const [members] = await db.query(
      `SELECT c.id, c.patient_user_id, c.caregiver_user_id, c.permission, c.created_at,
              u.email AS caregiver_email, u.display_name AS caregiver_name, u.photo_url
       FROM Caregivers c
       JOIN Users u ON u.id = c.caregiver_user_id
       WHERE c.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: "Tạo người thân thành công",
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
    const { permission } = req.body;

    const [existing] = await db.query(
      "SELECT * FROM Caregivers WHERE id = ? AND patient_user_id = ?",
      [id, userId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy hồ sơ" });
    }

    await db.query(
      `UPDATE Caregivers
       SET permission = ?
       WHERE id = ? AND patient_user_id = ?`,
      [permission || existing[0].permission, id, userId]
    );

    const [members] = await db.query(
      `SELECT c.id, c.patient_user_id, c.caregiver_user_id, c.permission, c.created_at,
              u.email AS caregiver_email, u.display_name AS caregiver_name, u.photo_url
       FROM Caregivers c
       JOIN Users u ON u.id = c.caregiver_user_id
       WHERE c.id = ?`,
      [id]
    );

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
      "SELECT * FROM Caregivers WHERE id = ? AND patient_user_id = ?",
      [id, userId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy hồ sơ" });
    }

    await db.query("DELETE FROM Caregivers WHERE id = ? AND patient_user_id = ?", [id, userId]);

    res.json({ success: true, message: "Xóa người thân thành công" });
  } catch (error) {
    console.error("Lỗi khi xóa hồ sơ gia đình:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa hồ sơ gia đình",
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
};
