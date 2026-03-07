const db = require("../config/database");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const googleClient = new OAuth2Client();

const createAccessToken = (user) =>
  jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

const OTP_EXPIRE_MINUTES = Number(process.env.RESET_OTP_EXPIRE_MINUTES || 10);
const RESET_TOKEN_EXPIRE_MINUTES = Number(
  process.env.RESET_TOKEN_EXPIRE_MINUTES || 15,
);

const generateSixDigitOtp = () =>
  String(Math.floor(100000 + Math.random() * 900000));

const hashSecret = (value) =>
  crypto.createHash("sha256").update(String(value || "")).digest("hex");

const ensureResetPasswordColumns = async () => {
  const [columnRows] = await db.query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'Users'
       AND COLUMN_NAME IN ('reset_token', 'reset_token_expire', 'reset_otp', 'reset_otp_expire')`,
  );

  const existingColumns = new Set(columnRows.map((row) => row.COLUMN_NAME));

  if (!existingColumns.has("reset_token")) {
    await db.query(
      "ALTER TABLE Users ADD COLUMN reset_token VARCHAR(255) NULL",
    );
  }

  if (!existingColumns.has("reset_token_expire")) {
    await db.query(
      "ALTER TABLE Users ADD COLUMN reset_token_expire DATETIME NULL",
    );
  }

  if (!existingColumns.has("reset_otp")) {
    await db.query(
      "ALTER TABLE Users ADD COLUMN reset_otp VARCHAR(255) NULL",
    );
  }

  if (!existingColumns.has("reset_otp_expire")) {
    await db.query(
      "ALTER TABLE Users ADD COLUMN reset_otp_expire DATETIME NULL",
    );
  }
};

const getGoogleClientIds = () => {
  const clientIds = [
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_WEB_CLIENT_ID,
    process.env.GOOGLE_ANDROID_CLIENT_ID,
    process.env.GOOGLE_IOS_CLIENT_ID,
  ]
    .concat((process.env.GOOGLE_CLIENT_IDS || "").split(","))
    .map((value) => (value || "").trim())
    .filter(Boolean);

  return [...new Set(clientIds)];
};

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
    const token = createAccessToken(user);

    res.json({
      message: "Login success",
      token,
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name || "",
        photo_url: user.photo_url || "",
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.googleLogin = async (req, res) => {
  try {
    const idToken = String(req.body?.idToken || "").trim();
    const accessToken = String(req.body?.accessToken || "").trim();

    if (!idToken && !accessToken) {
      return res.status(400).json({ message: "Missing Google token" });
    }

    const allowedClientIds = getGoogleClientIds();
    if (allowedClientIds.length === 0) {
      return res.status(500).json({
        message:
          "Google login is not configured on server. Missing GOOGLE_CLIENT_ID(S).",
      });
    }

    let googlePayload = null;

    if (idToken) {
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken,
          audience: allowedClientIds,
        });
        googlePayload = ticket.getPayload();
      } catch (_verifyError) {
        // Fallback qua access token nếu id token không xác minh được
      }
    }

    if (!googlePayload && accessToken) {
      try {
        const userInfoResponse = await fetch(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );

        if (userInfoResponse.ok) {
          googlePayload = await userInfoResponse.json();
        }
      } catch (_fetchError) {
        // Không làm gì, xử lý phía dưới
      }
    }

    if (!googlePayload) {
      return res.status(401).json({ message: "Invalid Google token" });
    }

    if (!googlePayload?.email) {
      return res.status(400).json({ message: "Google account has no email" });
    }

    if (googlePayload.email_verified === false) {
      return res.status(400).json({ message: "Google email is not verified" });
    }

    const [users] = await db.query("SELECT * FROM Users WHERE email = ?", [
      googlePayload.email,
    ]);

    let user = null;
    let finalDisplayName = "";
    let finalPhotoUrl = "";

    if (users.length > 0) {
      user = users[0];
      finalDisplayName = user.display_name || googlePayload.name || "";
      finalPhotoUrl = user.photo_url || googlePayload.picture || "";

      await db.query(
        `UPDATE Users SET
          display_name = COALESCE(display_name, ?),
          photo_url = COALESCE(photo_url, ?)
        WHERE id = ?`,
        [googlePayload.name || null, googlePayload.picture || null, user.id],
      );
    } else {
      const newUserId = uuidv4();
      const generatedPasswordHash = await bcrypt.hash(uuidv4(), 10);
      const displayName =
        googlePayload.name || googlePayload.given_name || "Google User";

      await db.query(
        `INSERT INTO Users
          (id, email, password_hash, display_name, dob, gender, photo_url)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          newUserId,
          googlePayload.email,
          generatedPasswordHash,
          displayName,
          "1970-01-01",
          "Khác",
          googlePayload.picture || null,
        ],
      );

      user = {
        id: newUserId,
        email: googlePayload.email,
      };
      finalDisplayName = displayName;
      finalPhotoUrl = googlePayload.picture || "";
    }

    const token = createAccessToken(user);

    return res.json({
      message: "Google login success",
      token,
      user: {
        id: user.id,
        email: user.email,
        display_name: finalDisplayName,
        photo_url: finalPhotoUrl,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
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

exports.forgotPassword = async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const [users] = await db.query("SELECT id FROM Users WHERE email = ?", [email]);
    if (users.length === 0) {
      return res.status(404).json({ message: "Email not found" });
    }

    await ensureResetPasswordColumns();

    const otpCode = generateSixDigitOtp();
    const otpHash = hashSecret(otpCode);
    const otpExpireTime = new Date(Date.now() + OTP_EXPIRE_MINUTES * 60 * 1000);

    await db.query(
      `UPDATE Users
       SET reset_otp = ?,
           reset_otp_expire = ?,
           reset_token = NULL,
           reset_token_expire = NULL
       WHERE email = ?`,
      [otpHash, otpExpireTime, email],
    );

    const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
    const smtpPort = Number(process.env.SMTP_PORT || 587);
    const smtpSecure =
      String(process.env.SMTP_SECURE || "false").toLowerCase() === "true";
    const smtpUser = String(process.env.SMTP_USER || process.env.EMAIL_USER || "").trim();
    const smtpPass = String(process.env.SMTP_PASS || process.env.EMAIL_PASS || "")
      .trim()
      .replace(/\s+/g, "");
    const smtpFrom = process.env.SMTP_FROM || smtpUser;

    if (!smtpUser || !smtpPass) {
      return res.status(500).json({ message: "SMTP is not configured" });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.sendMail({
      from: smtpFrom,
      to: email,
      subject: "Ma xac thuc dat lai mat khau",
      html: `
        <h3>Ma xac thuc dat lai mat khau</h3>
        <p>Su dung ma OTP sau de dat lai mat khau:</p>
        <h2 style="letter-spacing:4px;">${otpCode}</h2>
        <p>Ma co hieu luc trong ${OTP_EXPIRE_MINUTES} phut.</p>
        <p>Neu ban khong yeu cau, vui long bo qua email nay.</p>
      `,
    });

    res.json({ message: "OTP sent to email" });
  } catch (error) {
    console.error(error);

    if (error.code === "EAUTH") {
      return res.status(500).json({ message: "SMTP authentication failed" });
    }
    if (
      error.code === "ESOCKET" ||
      error.code === "ECONNECTION" ||
      error.code === "ETIMEDOUT"
    ) {
      return res.status(500).json({ message: "SMTP connection failed" });
    }

    res.status(500).json({ message: "Server error" });
  }
};

exports.verifyResetOtp = async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const otp = String(req.body?.otp || "").trim();

    if (!email || !otp) {
      return res.status(400).json({ message: "Missing email or otp" });
    }

    await ensureResetPasswordColumns();

    const [users] = await db.query(
      "SELECT id, reset_otp, reset_otp_expire FROM Users WHERE email = ?",
      [email],
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "Email not found" });
    }

    const user = users[0];
    const isExpired =
      !user.reset_otp_expire || new Date(user.reset_otp_expire).getTime() < Date.now();
    const isMatched = user.reset_otp === hashSecret(otp);

    if (!user.reset_otp || isExpired || !isMatched) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const resetTokenRaw = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = hashSecret(resetTokenRaw);
    const resetTokenExpire = new Date(
      Date.now() + RESET_TOKEN_EXPIRE_MINUTES * 60 * 1000,
    );

    await db.query(
      `UPDATE Users
       SET reset_token = ?,
           reset_token_expire = ?,
           reset_otp = NULL,
           reset_otp_expire = NULL
       WHERE id = ?`,
      [resetTokenHash, resetTokenExpire, user.id],
    );

    return res.json({
      message: "OTP verified",
      reset_token: resetTokenRaw,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const token = String(req.body?.token || "").trim();
    const newPassword = String(req.body?.newPassword || "");

    if (!token || !newPassword) {
      return res.status(400).json({ message: "Missing data" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password too short" });
    }

    await ensureResetPasswordColumns();

    const tokenHash = hashSecret(token);
    const [users] = await db.query(
      `SELECT id
       FROM Users
       WHERE (reset_token = ? OR reset_token = ?)
         AND reset_token_expire > NOW()
       LIMIT 1`,
      [token, tokenHash],
    );

    if (users.length === 0) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.query(
      `UPDATE Users
       SET password_hash = ?,
           reset_token = NULL,
           reset_token_expire = NULL,
           reset_otp = NULL,
           reset_otp_expire = NULL
       WHERE id = ?`,
      [hashedPassword, users[0].id],
    );

    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
