const db = require("../config/database");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");

//dangky
exports.register = async (req, res) => {
  try {
    const { email, password, username, dob, gender } = req.body;

    // Kiểm tra thiếu dữ liệu
    if (!email || !password || !username || !dob || !gender) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Kiểm tra email đã tồn tại chưa
    const [existingUser] = await db.query(
      "SELECT * FROM Users WHERE email = ?",
      [email],
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUserId = uuidv4();

    await db.query(
      `INSERT INTO Users 
      (id, email, password_hash, display_name, dob, gender) 
      VALUES (?, ?, ?, ?, ?, ?)`,
      [newUserId, email, hashedPassword, username, dob, gender],
    );

    res.status(201).json({
      message: "Register success",
      user_id: newUserId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

//dangnhap
const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Missing email or password" });
    }

    // Tìm user theo email
    const [users] = await db.query("SELECT * FROM Users WHERE email = ?", [
      email,
    ]);

    if (users.length === 0) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const user = users[0];

    // So sánh password
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Tạo JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    res.json({
      message: "Login success",
      token: token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.query(
      "SELECT id, email, display_name, dob, photo_url, created_at FROM users WHERE id = ?",
      [userId],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

//update profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const { username, photo_url, dob, gender, height, weight } = req.body;

    await db.query(
      `UPDATE Users SET
        display_name = COALESCE(?, display_name),
        photo_url = COALESCE(?, photo_url),
        dob = COALESCE(?, dob),
        gender = COALESCE(?, gender),
        height_cm = COALESCE(?, height_cm),
        weight_kg = COALESCE(?, weight_kg)
      WHERE id = ?`,
      [username, photo_url, dob, gender, height, weight, userId],
    );

    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

//QuenMK
const crypto = require("crypto");
const nodemailer = require("nodemailer");

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const [user] = await db.query("SELECT * FROM Users WHERE email = ?", [
      email,
    ]);

    if (user.length === 0) {
      return res.status(404).json({ message: "Email not found" });
    }

    // Tạo token
    const resetToken = crypto.randomBytes(32).toString("hex");

    const expireTime = new Date(Date.now() + 15 * 60 * 1000); // 15 phút

    await db.query(
      "UPDATE Users SET reset_token = ?, reset_token_expire = ? WHERE email = ?",
      [resetToken, expireTime, email],
    );

    // Cấu hình mail
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const resetLink = `https://your-app-link/reset-password?token=${resetToken}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Reset Password",
      html: `
        <h3>Password Reset</h3>
        <p>Click link bên dưới để reset mật khẩu:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>Link hết hạn sau 15 phút.</p>
      `,
    });

    res.json({ message: "Reset link sent to email" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: "Missing data" });
    }

    const [user] = await db.query(
      "SELECT * FROM Users WHERE reset_token = ? AND reset_token_expire > NOW()",
      [token],
    );

    if (user.length === 0) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.query(
      "UPDATE Users SET password_hash = ?, reset_token = NULL, reset_token_expire = NULL WHERE id = ?",
      [hashedPassword, user[0].id],
    );

    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
