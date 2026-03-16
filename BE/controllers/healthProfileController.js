const db = require("../config/database");

const CATEGORY_GROUPS = {
  conditions: [
    "underlying",
    "underlying_condition",
    "underlying_conditions",
    "condition",
    "conditions",
    "benh_ly_nen",
    "benhlynen",
    "benhnennen",
    "nen",
  ],
  allergies: ["allergy", "allergies", "di_ung", "diung", "allergic"],
  surgeries: [
    "surgery",
    "surgeries",
    "surgery_history",
    "surgical_history",
    "phau_thuat",
    "phauthuat",
    "tien_su_phau_thuat",
  ],
};

const normalizeCategory = (value) => String(value || "").trim().toLowerCase();

const getBucketForCategory = (category) => {
  const normalized = normalizeCategory(category);
  if (!normalized) {
    return null;
  }
  for (const [bucket, aliases] of Object.entries(CATEGORY_GROUPS)) {
    if (aliases.includes(normalized)) {
      return bucket;
    }
  }
  return null;
};

const calculateBmi = (heightCm, weightKg) => {
  const height = Number(heightCm);
  const weight = Number(weightKg);
  if (!Number.isFinite(height) || height <= 0 || !Number.isFinite(weight) || weight <= 0) {
    return null;
  }
  const meters = height / 100;
  return Number((weight / (meters * meters)).toFixed(1));
};

const getBmiStatus = (bmi) => {
  if (!Number.isFinite(bmi) || bmi <= 0) {
    return "";
  }
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
};

const getMemberProfile = async (userId) => {
  const [rows] = await db.query(
    "SELECT id, display_name, height_cm, weight_kg FROM users WHERE id = ?",
    [userId],
  );
  return rows[0] || null;
};

const getHealthProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const profile = await getMemberProfile(userId);
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    const [records] = await db.query(
      "SELECT * FROM healthrecords WHERE user_id = ? ORDER BY created_at DESC",
      [userId],
    );

    const grouped = {
      conditions: [],
      allergies: [],
      surgeries: [],
      others: [],
    };

    records.forEach((record) => {
      const bucket = getBucketForCategory(record.category);
      if (bucket && grouped[bucket]) {
        grouped[bucket].push(record);
      } else {
        grouped.others.push(record);
      }
    });

    const bmi = calculateBmi(profile.height_cm, profile.weight_kg);

    return res.json({
      success: true,
      data: {
        member_id: null,
        height_cm: profile.height_cm ?? null,
        weight_kg: profile.weight_kg ?? null,
        bmi,
        bmi_status: getBmiStatus(bmi),
        conditions: grouped.conditions,
        allergies: grouped.allergies,
        surgeries: grouped.surgeries,
        others: grouped.others,
      },
      total: {
        conditions: grouped.conditions.length,
        allergies: grouped.allergies.length,
        surgeries: grouped.surgeries.length,
        others: grouped.others.length,
      },
    });
  } catch (error) {
    console.error("Error fetching health profile:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  getHealthProfile,
};
