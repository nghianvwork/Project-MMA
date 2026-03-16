const db = require("../config/database");

let relationColumnEnsured = false;

const ensureRelationColumn = async () => {
  if (relationColumnEnsured) {
    return;
  }

  const [rows] = await db.query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'Caregivers'
       AND COLUMN_NAME = 'relation'`
  );

  if (rows.length === 0) {
    await db.query(
      "ALTER TABLE Caregivers ADD COLUMN relation VARCHAR(30) NULL AFTER permission"
    );
  }

  relationColumnEnsured = true;
};

const getFamilyMembers = async (req, res) => {
  try {
    await ensureRelationColumn();
    const userId = req.userId;
    const [members] = await db.query(
      `SELECT c.id, c.patient_user_id, c.caregiver_user_id, c.permission, c.relation, c.created_at,
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
    await ensureRelationColumn();
    const { id } = req.params;
    const userId = req.userId;
    const [members] = await db.query(
      `SELECT c.id, c.patient_user_id, c.caregiver_user_id, c.permission, c.relation, c.created_at,
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
    await ensureRelationColumn();
    const userId = req.userId;
    const { caregiver_user_id, caregiver_email, permission, relation } = req.body;

    let caregiverId = caregiver_user_id;
    const normalizedEmail = String(caregiver_email || "").trim().toLowerCase();

    if (!caregiverId && normalizedEmail) {
      const [users] = await db.query("SELECT id, email FROM Users WHERE email = ?", [normalizedEmail]);
      caregiverId = users[0]?.id;

      if (caregiverId) {
        return res.status(400).json({
          success: false,
          message: "Email người thân đã tồn tại",
        });
      }

      const { v4: uuidv4 } = require("uuid");
      const bcrypt = require("bcrypt");
      const placeholderUserId = uuidv4();
      const placeholderPassword = await bcrypt.hash(uuidv4(), 10);
      const placeholderName = normalizedEmail.split("@")[0] || "Nguoi than";

      await db.query(
        `INSERT INTO Users
         (id, email, password_hash, display_name, dob, gender)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [placeholderUserId, normalizedEmail, placeholderPassword, placeholderName, "1970-01-01", "Khác"]
      );

      caregiverId = placeholderUserId;
    }

    if (!caregiverId) {
      return res.status(400).json({
        success: false,
        message: "Email người thân không hợp lệ",
      });
    }

    if (String(caregiverId) === String(userId)) {
      return res.status(400).json({
        success: false,
        message: "Không thể thêm chính bạn vào danh sách người thân",
      });
    }

    const normalizedRelation = String(relation || "").trim() || null;

    const [result] = await db.query(
      `INSERT INTO Caregivers
      (patient_user_id, caregiver_user_id, permission, relation)
      VALUES (?, ?, ?, ?)`,
      [userId, caregiverId, permission || "view", normalizedRelation]
    );

    const [members] = await db.query(
      `SELECT c.id, c.patient_user_id, c.caregiver_user_id, c.permission, c.relation, c.created_at,
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
    await ensureRelationColumn();
    const { id } = req.params;
    const userId = req.userId;
    const { permission, relation } = req.body;

    const [existing] = await db.query(
      "SELECT * FROM Caregivers WHERE id = ? AND patient_user_id = ?",
      [id, userId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy hồ sơ" });
    }

    await db.query(
      `UPDATE Caregivers
       SET permission = ?, relation = ?
       WHERE id = ? AND patient_user_id = ?`,
      [
        permission || existing[0].permission,
        relation !== undefined ? relation : existing[0].relation,
        id,
        userId,
      ]
    );

    const [members] = await db.query(
      `SELECT c.id, c.patient_user_id, c.caregiver_user_id, c.permission, c.relation, c.created_at,
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
    await ensureRelationColumn();
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
