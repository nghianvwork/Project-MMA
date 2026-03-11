import { StatusBar } from "expo-status-bar";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { requestJsonWithFallback } from "../utils/apiClient";

const EMPTY_PROFILE = {
  displayName: "",
  age: "",
  gender: "",
  bloodType: "",
  bloodPressure: "",
  heightCm: "",
  weightKg: "",
};

const FAMILY_MEMBERS = [
  {
    key: "me",
    label: "Tôi",
    icon: "person-outline",
    active: true,
    bg: "#2c8e62",
    iconColor: "#ffffff",
  },
  {
    key: "father",
    label: "Bố",
    icon: "man-outline",
    active: false,
    bg: "#e3edff",
    iconColor: "#7a90d4",
  },
  {
    key: "mother",
    label: "Mẹ",
    icon: "woman-outline",
    active: false,
    bg: "#f7e8f1",
    iconColor: "#d07ca7",
  },
  {
    key: "child",
    label: "Con",
    icon: "happy-outline",
    active: false,
    bg: "#fbead8",
    iconColor: "#e5a05e",
  },
  {
    key: "other",
    label: "Khác",
    icon: "people-outline",
    active: false,
    bg: "#eef1f5",
    iconColor: "#9fa8b5",
  },
];

const SETTING_ITEMS = [
  {
    key: "health_profile",
    title: "Hồ sơ sức khỏe",
    icon: "shield-checkmark-outline",
    bg: "#edf6ef",
    iconColor: "#1fa36c",
  },
  {
    key: "medicine_history",
    title: "Lịch sử uống thuốc",
    icon: "calendar-outline",
    bg: "#fff1e6",
    iconColor: "#ff8f3f",
  },
  {
    key: "notifications",
    title: "Cài đặt thông báo",
    icon: "notifications-outline",
    bg: "#f0eaff",
    iconColor: "#9b63f2",
  },
  {
    key: "security",
    title: "Bảo mật",
    icon: "shield-half-outline",
    bg: "#ffe9eb",
    iconColor: "#f35b67",
  },
];

const decodeJwtPayload = (token) => {
  if (!token || typeof atob !== "function") {
    return {};
  }

  try {
    const payloadPart = String(token).split(".")[1] || "";
    if (!payloadPart) {
      return {};
    }
    const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padding = base64.length % 4;
    const padded = padding ? `${base64}${"=".repeat(4 - padding)}` : base64;
    const decoded = atob(padded);
    return JSON.parse(decoded);
  } catch (_error) {
    return {};
  }
};

const toTextOrEmpty = (value) => {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).trim();
};

const toNumberTextOrEmpty = (value) => {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return "";
  }
  return String(parsed);
};

const getAgeFromDob = (dobValue) => {
  if (!dobValue) {
    return "";
  }

  const dob = new Date(dobValue);
  if (Number.isNaN(dob.getTime())) {
    return "";
  }

  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age -= 1;
  }

  return age >= 0 ? age : "";
};

const toGenderText = (genderValue) => {
  const normalized = String(genderValue || "").trim().toLowerCase();
  if (normalized === "nam" || normalized === "male") {
    return "Nam";
  }
  if (normalized === "nữ" || normalized === "nu" || normalized === "female") {
    return "Nữ";
  }
  if (normalized === "khác" || normalized === "khac" || normalized === "other") {
    return "Khác";
  }
  return "";
};

const toBloodPressureText = (profileData) => {
  const directValue = toTextOrEmpty(profileData?.blood_pressure);
  if (directValue) {
    return directValue;
  }

  const systolic = toTextOrEmpty(profileData?.blood_pressure_systolic);
  const diastolic = toTextOrEmpty(profileData?.blood_pressure_diastolic);
  if (systolic && diastolic) {
    return `${systolic}/${diastolic}`;
  }
  return "";
};

const normalizeProfileData = (profileData) => {
  if (!profileData || typeof profileData !== "object") {
    return { ...EMPTY_PROFILE };
  }

  return {
    displayName: toTextOrEmpty(profileData?.display_name),
    age: getAgeFromDob(profileData?.dob),
    gender: toGenderText(profileData?.gender),
    bloodType: toTextOrEmpty(profileData?.blood_type),
    bloodPressure: toBloodPressureText(profileData),
    heightCm: toNumberTextOrEmpty(profileData?.height_cm),
    weightKg: toNumberTextOrEmpty(profileData?.weight_kg),
  };
};

export default function ProfileScreen({ session }) {
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [profile, setProfile] = useState({ ...EMPTY_PROFILE });
  const [historyStats, setHistoryStats] = useState({
    scheduleTotal: 0,
    medicineTotal: 0,
  });

  const token = session?.token || process.env.EXPO_PUBLIC_AUTH_TOKEN || "";
  const tokenPayload = useMemo(() => decodeJwtPayload(token), [token]);
  const userId = session?.user?.id || tokenPayload?.id || "";

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async () => {
      setLoading(true);
      setErrorText("");

      if (!token) {
        if (mounted) {
          setProfile({ ...EMPTY_PROFILE });
          setHistoryStats({ scheduleTotal: 0, medicineTotal: 0 });
          setErrorText("Chưa có token đăng nhập.");
          setLoading(false);
        }
        return;
      }

      try {
        const { response, data } = await requestJsonWithFallback("/api/user/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!mounted) {
          return;
        }

        if (!response.ok) {
          setProfile({ ...EMPTY_PROFILE });
          setHistoryStats({ scheduleTotal: 0, medicineTotal: 0 });
          setErrorText(data.message || "Không tải được hồ sơ từ backend.");
          setLoading(false);
          return;
        }

        setProfile(normalizeProfileData(data));

        if (userId) {
          try {
            const headers = { Authorization: `Bearer ${token}` };
            const [medicineResult, scheduleResult] = await Promise.all([
              requestJsonWithFallback("/api/medicines", { headers }),
              requestJsonWithFallback("/api/schedules", { headers }),
            ]);

            if (!mounted) {
              return;
            }

            setHistoryStats({
              medicineTotal:
                medicineResult.response.ok && Number.isFinite(Number(medicineResult.data?.total))
                  ? Number(medicineResult.data.total)
                  : 0,
              scheduleTotal:
                scheduleResult.response.ok && Number.isFinite(Number(scheduleResult.data?.total))
                  ? Number(scheduleResult.data.total)
                  : 0,
            });
          } catch (_historyError) {
            if (mounted) {
              setHistoryStats({ scheduleTotal: 0, medicineTotal: 0 });
            }
          }
        } else {
          setHistoryStats({ scheduleTotal: 0, medicineTotal: 0 });
        }

        setLoading(false);
      } catch (_error) {
        if (!mounted) {
          return;
        }

        setProfile({ ...EMPTY_PROFILE });
        setHistoryStats({ scheduleTotal: 0, medicineTotal: 0 });
        setErrorText("Không thể kết nối backend để lấy hồ sơ.");
        setLoading(false);
      }
    };

    fetchProfile();

    return () => {
      mounted = false;
    };
  }, [token, userId]);

  const identityText = useMemo(() => {
    const segments = [];
    if (profile.age !== "") {
      segments.push(`${profile.age} tuổi`);
    }
    if (profile.gender) {
      segments.push(profile.gender);
    }
    if (profile.bloodType) {
      segments.push(`Nhóm máu ${profile.bloodType}`);
    }
    return segments.join(" • ");
  }, [profile.age, profile.gender, profile.bloodType]);

  const scheduleHintText = historyStats.scheduleTotal > 0 ? `${historyStats.scheduleTotal} lịch` : "";

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.phoneFrame}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.screenTitle}>Hồ sơ Cá nhân</Text>
              <Text style={styles.screenSubtitle}>Quản lý tài khoản & gia đình</Text>
            </View>
            <Pressable style={styles.circleButton}>
              <Ionicons name="settings-outline" size={18} color="#607086" />
            </Pressable>
          </View>

          <View style={styles.profileCard}>
            <View style={styles.avatarWrap}>
              <Ionicons name="person-outline" size={24} color="#247a59" />
              <View style={styles.avatarDot} />
            </View>

            <View style={styles.profileBody}>
              <View style={styles.nameRow}>
                <Text style={styles.nameText}>{profile.displayName}</Text>
                
              </View>
              {identityText ? <Text style={styles.metaText}>{identityText}</Text> : null}
            </View>

            <Pressable style={styles.editPill}>
              <Ionicons name="create-outline" size={16} color="#1f8d63" />
            </Pressable>
          </View>

          {!!errorText && <Text style={styles.errorText}>{errorText}</Text>}

          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color="#21c97d" />
              <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
            </View>
          ) : null}

          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>HỒ SƠ GIA ĐÌNH</Text>
            <Pressable style={styles.addButton}>
              <Ionicons name="add-circle-outline" size={14} color="#3b9c6f" />
              <Text style={styles.addText}>Thêm mới</Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.familyRow}
          >
            {FAMILY_MEMBERS.map((item) => (
              <View key={item.key} style={styles.familyItem}>
                <View
                  style={[
                    styles.familyAvatar,
                    item.active && styles.familyAvatarActive,
                    { backgroundColor: item.bg },
                  ]}
                >
                  <Ionicons name={item.icon} size={18} color={item.iconColor} />
                </View>
                <Text style={[styles.familyLabel, item.active && styles.familyLabelActive]}>
                  {item.label}
                </Text>
              </View>
            ))}
          </ScrollView>

          <Text style={styles.sectionTitle}>THÔNG TIN & CÀI ĐẶT</Text>

          <View style={styles.settingsWrap}>
            {SETTING_ITEMS.map((item, index) => (
              <View key={item.key}>
                <Pressable style={styles.settingItem}>
                  <View style={[styles.settingIconWrap, { backgroundColor: item.bg }]}>
                    <Ionicons name={item.icon} size={18} color={item.iconColor} />
                  </View>
                  <Text style={styles.settingText}>{item.title}</Text>
                  {item.key === "medicine_history" && scheduleHintText ? (
                    <Text style={styles.settingHint}>{scheduleHintText}</Text>
                  ) : null}
                  <Ionicons name="chevron-forward" size={18} color="#96a2b4" />
                </Pressable>
                {index < SETTING_ITEMS.length - 1 ? <View style={styles.settingDivider} /> : null}
              </View>
            ))}
          </View>

          <Pressable style={styles.logoutButton}>
            <MaterialCommunityIcons name="logout" size={17} color="#ef4e4e" />
            <Text style={styles.logoutText}>Đăng xuất</Text>
          </Pressable>
        </ScrollView>

        <View style={styles.tabBar}>
          <Pressable style={styles.tabItem}>
            <Ionicons name="home-outline" size={19} color="#a6b0c1" />
            <Text style={styles.tabText}>Trang chủ</Text>
          </Pressable>
          <Pressable style={styles.tabItem}>
            <Ionicons name="calendar-outline" size={19} color="#a6b0c1" />
            <Text style={styles.tabText}>Lịch hẹn</Text>
          </Pressable>
          <Pressable style={styles.tabItem}>
            <Ionicons name="medkit-outline" size={19} color="#a6b0c1" />
            <Text style={styles.tabText}>Tủ thuốc</Text>
          </Pressable>
          <Pressable style={styles.tabItem}>
            <Ionicons name="person" size={19} color="#1f9d66" />
            <Text style={[styles.tabText, styles.tabTextActive]}>Cá nhân</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f2f4f6",
  },
  phoneFrame: {
    flex: 1,
    width: "100%",
    alignSelf: "center",
    backgroundColor: "#f2f4f6",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 108,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  screenTitle: {
    fontSize: 38,
    lineHeight: 44,
    fontWeight: "800",
    color: "#11223d",
  },
  screenSubtitle: {
    marginTop: 3,
    fontSize: 15,
    color: "#74859c",
  },
  circleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  profileCard: {
    marginTop: 14,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  avatarWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#e8f3ec",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  avatarDot: {
    position: "absolute",
    right: -1,
    bottom: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#35c770",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  profileBody: {
    marginLeft: 12,
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  nameText: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "700",
    color: "#172740",
    maxWidth: "78%",
  },
  ownerBadge: {
    height: 20,
    paddingHorizontal: 7,
    borderRadius: 10,
    backgroundColor: "#d5f7ec",
    alignItems: "center",
    justifyContent: "center",
  },
  ownerBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#239a6d",
    letterSpacing: 0.4,
  },
  metaText: {
    marginTop: 3,
    fontSize: 14,
    color: "#7888a0",
  },
  editPill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#edf8f1",
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    marginTop: 8,
    color: "#e24f56",
    fontSize: 14,
  },
  loadingWrap: {
    marginTop: 8,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 7,
    fontSize: 13,
    color: "#73859b",
  },
  sectionHead: {
    marginTop: 16,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: "#7d8ca2",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.7,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addText: {
    color: "#3b9c6f",
    fontSize: 14,
    fontWeight: "600",
  },
  familyRow: {
    gap: 14,
    paddingBottom: 6,
  },
  familyItem: {
    alignItems: "center",
    minWidth: 48,
  },
  familyAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  familyAvatarActive: {
    borderWidth: 2,
    borderColor: "#2c8e62",
  },
  familyLabel: {
    marginTop: 5,
    fontSize: 12,
    color: "#96a3b6",
  },
  familyLabelActive: {
    color: "#2c8e62",
    fontWeight: "700",
  },
  settingsWrap: {
    marginTop: 10,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
  },
  settingItem: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  settingIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  settingText: {
    flex: 1,
    color: "#1e2c44",
    fontSize: 17,
    fontWeight: "600",
  },
  settingHint: {
    marginRight: 4,
    color: "#8f9bb0",
    fontSize: 13,
    fontWeight: "500",
  },
  settingDivider: {
    height: 1,
    backgroundColor: "#edf1f6",
    marginLeft: 40,
  },
  logoutButton: {
    marginTop: 18,
    height: 56,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#f2dadb",
    backgroundColor: "#fff3f3",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  logoutText: {
    color: "#ef4e4e",
    fontSize: 18,
    fontWeight: "700",
  },
  tabBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 82,
    borderTopWidth: 1,
    borderTopColor: "#e2e8ef",
    backgroundColor: "#ffffff",
    flexDirection: "row",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#a6b0c1",
  },
  tabTextActive: {
    color: "#1f9d66",
    fontWeight: "700",
  },
});
