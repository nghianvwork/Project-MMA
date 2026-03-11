const db = require("../config/database");

const ensureMemberOwnership = async (memberId, userId) => {
  if (!memberId) {
    return false;
  }
  const [members] = await db.query(
    "SELECT id FROM FamilyMembers WHERE id = ? AND user_id = ?",
    [memberId, userId]
  );
  return members.length > 0;
};

const getAccessGrants = async (req, res) => {
  try {
    const userId = req.userId;
    const { member_id } = req.query;

    let query = "SELECT * FROM DataAccessGrants WHERE user_id = ?";
    const params = [userId];

    if (member_id) {
      query += " AND member_id = ?";
      params.push(member_id);
    }

    query += " ORDER BY created_at DESC";

    const [grants] = await db.query(query, params);
    res.json({ success: true, data: grants, total: grants.length });
  } catch (error) {
    console.error("Lỗi khi lấy quyền truy cập dữ liệu:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy quyền truy cập dữ liệu",
      error: error.message,
    });
  }
};

const createAccessGrant = async (req, res) => {
  try {
    const userId = req.userId;
    const { member_id, grantee_email, permission_level, status } = req.body;

    if (!member_id || !grantee_email || !permission_level) {
      return res.status(400).json({
        success: false,
        message: "member_id, grantee_email và permission_level là bắt buộc",
      });
    }

    const hasMember = await ensureMemberOwnership(member_id, userId);
    if (!hasMember) {
      return res.status(400).json({ success: false, message: "member_id không hợp lệ" });
    }

    const [result] = await db.query(
      `INSERT INTO DataAccessGrants
      (user_id, member_id, grantee_email, permission_level, status)
      VALUES (?, ?, ?, ?, ?)`,
      [userId, member_id, grantee_email, permission_level, status || "pending"]
    );

    const [rows] = await db.query("SELECT * FROM DataAccessGrants WHERE id = ?", [
      result.insertId,
    ]);

    res.status(201).json({
      success: true,
      message: "Tạo quyền truy cập dữ liệu thành công",
      data: rows[0],
    });
  } catch (error) {
    console.error("Lỗi khi tạo quyền truy cập dữ liệu:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi tạo quyền truy cập dữ liệu",
      error: error.message,
    });
  }
};

const updateAccessGrant = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { grantee_email, permission_level, status } = req.body;

    const [existing] = await db.query(
      "SELECT * FROM DataAccessGrants WHERE id = ? AND user_id = ?",
      [id, userId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy quyền truy cập" });
    }

    await db.query(
      `UPDATE DataAccessGrants
       SET grantee_email = ?, permission_level = ?, status = ?
       WHERE id = ? AND user_id = ?`,
      [
        grantee_email || existing[0].grantee_email,
        permission_level || existing[0].permission_level,
        status || existing[0].status,
        id,
        userId,
      ]
    );

    const [rows] = await db.query("SELECT * FROM DataAccessGrants WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "Cập nhật quyền truy cập dữ liệu thành công",
      data: rows[0],
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật quyền truy cập dữ liệu:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật quyền truy cập dữ liệu",
      error: error.message,
    });
  }
};

const deleteAccessGrant = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const [existing] = await db.query(
      "SELECT id FROM DataAccessGrants WHERE id = ? AND user_id = ?",
      [id, userId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy quyền truy cập" });
    }

    await db.query("DELETE FROM DataAccessGrants WHERE id = ? AND user_id = ?", [id, userId]);
    res.json({ success: true, message: "Xóa quyền truy cập dữ liệu thành công" });
  } catch (error) {
    console.error("Lỗi khi xóa quyền truy cập dữ liệu:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa quyền truy cập dữ liệu",
      error: error.message,
    });
  }
};

module.exports = {
  getAccessGrants,
  createAccessGrant,
  updateAccessGrant,
  deleteAccessGrant,
};
