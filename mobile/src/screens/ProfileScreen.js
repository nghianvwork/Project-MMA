import { StatusBar } from "expo-status-bar";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { requestJsonWithFallback } from "../utils/apiClient";

const ACCOUNT_ITEMS = [
  {
    key: "health-profile",
    icon: "card-account-details-outline",
    label: "Hồ sơ sức khỏe",
  },
  {
    key: "caretaker",
    icon: "account-group-outline",
    label: "Người thân (Caretaker Mode)",
  },
  {
    key: "history",
    icon: "history",
    label: "Lịch sử uống thuốc",
  },
];

const APP_ITEMS = [
  {
    key: "notifications",
    icon: "bell-outline",
    label: "Cài đặt thông báo",
  },
  {
    key: "security",
    icon: "shield-check-outline",
    label: "Bảo mật",
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

const extractNameFromEmail = (emailValue) => {
  if (!emailValue) {
    return "Người dùng";
  }
  return String(emailValue).split("@")[0] || "Người dùng";
};

const toYearText = (createdAt) => {
  if (!createdAt) {
    return "";
  }

  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return String(date.getFullYear());
};

const normalizeProfileData = (profileData, session) => {
  const tokenPayload = decodeJwtPayload(session?.token || "");
  const sessionUser = session?.user || {};
  const fallbackEmail =
    sessionUser.email || session?.email || tokenPayload?.email || "";

  const displayName =
    profileData?.display_name ||
    sessionUser.display_name ||
    extractNameFromEmail(fallbackEmail);

  return {
    displayName,
    email: profileData?.email || fallbackEmail,
    photoUrl: profileData?.photo_url || sessionUser.photo_url || "",
    createdAt: profileData?.created_at || "",
  };
};

function ProfileMenuSection({ title, items }) {
  return (
    <View style={styles.sectionWrap}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.menuCard}>
        {items.map((item, index) => (
          <View key={item.key}>
            <Pressable style={styles.menuItem}>
              <View style={styles.menuIconWrap}>
                <MaterialCommunityIcons
                  name={item.icon}
                  size={18}
                  color="#20d8c4"
                />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color="#9da8b9" />
            </Pressable>
            {index < items.length - 1 ? <View style={styles.menuDivider} /> : null}
          </View>
        ))}
      </View>
    </View>
  );
}

export default function ProfileScreen({ session, onBack, onLogout }) {
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [profile, setProfile] = useState(() => normalizeProfileData(null, session));

  const token = session?.token || process.env.EXPO_PUBLIC_AUTH_TOKEN || "";

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      setLoading(true);
      setErrorText("");

      if (!token) {
        if (isMounted) {
          setProfile(normalizeProfileData(null, session));
          setErrorText("Chưa có token đăng nhập. Hiển thị dữ liệu tạm.");
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

        if (!isMounted) {
          return;
        }

        if (!response.ok) {
          setProfile(normalizeProfileData(null, session));
          setErrorText(data.message || "Không tải được hồ sơ từ backend.");
          setLoading(false);
          return;
        }

        setProfile(normalizeProfileData(data, session));
        setLoading(false);
      } catch (_error) {
        if (!isMounted) {
          return;
        }
        setProfile(normalizeProfileData(null, session));
        setErrorText("Không thể kết nối backend để tải hồ sơ.");
        setLoading(false);
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [session, token]);

  const memberYear = useMemo(() => toYearText(profile.createdAt), [profile.createdAt]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.phoneFrame}>
        <View style={styles.topBar}>
          <Pressable style={styles.backButton} onPress={() => onBack?.()}>
            <Ionicons name="arrow-back" size={21} color="#22314a" />
          </Pressable>
          <Text style={styles.topTitle}>Hồ sơ Cá nhân</Text>
          <View style={styles.topSpacer} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.profileHeaderCard}>
            <View style={styles.avatarBorder}>
              {profile.photoUrl ? (
                <Image source={{ uri: profile.photoUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Ionicons name="person" size={38} color="#7ca8a2" />
                </View>
              )}
              <View style={styles.cameraBadge}>
                <Ionicons name="camera-outline" size={11} color="#ffffff" />
              </View>
            </View>

            <Text style={styles.nameText}>{profile.displayName}</Text>



            <Text style={styles.memberText}>
              {memberYear ? `Thành viên từ ${memberYear}` : "Thành viên MedTrack"}
            </Text>

            {!!errorText && <Text style={styles.errorText}>{errorText}</Text>}
          </View>

          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color="#20d8c4" />
              <Text style={styles.loadingText}>Đang tải hồ sơ từ backend...</Text>
            </View>
          ) : null}

          <ProfileMenuSection title="QUẢN LÝ TÀI KHOẢN" items={ACCOUNT_ITEMS} />
          <ProfileMenuSection title="ỨNG DỤNG" items={APP_ITEMS} />

          <Pressable style={styles.logoutButton} onPress={() => onLogout?.()}>
            <MaterialCommunityIcons name="logout" size={17} color="#ff4f57" />
            <Text style={styles.logoutText}>Đăng xuất</Text>
          </Pressable>
        </ScrollView>

        <View style={styles.tabBar}>
          <Pressable style={styles.tabItem}>
            <Ionicons name="home-outline" size={19} color="#a8b3c3" />
            <Text style={styles.tabText}>Trang chủ</Text>
          </Pressable>
          <Pressable style={styles.tabItem}>
            <Ionicons name="calendar-outline" size={19} color="#a8b3c3" />
            <Text style={styles.tabText}>Lịch nhắc</Text>
          </Pressable>
          <Pressable style={styles.tabItem}>
            <Ionicons name="bar-chart-outline" size={19} color="#a8b3c3" />
            <Text style={styles.tabText}>Báo cáo</Text>
          </Pressable>
          <Pressable style={styles.tabItem}>
            <Ionicons name="person-outline" size={19} color="#24d8c4" />
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
    backgroundColor: "#eff2f5",
  },
  phoneFrame: {
    flex: 1,
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    backgroundColor: "#eff2f5",
  },
  topBar: {
    height: 54,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#e3e8ee",
    backgroundColor: "#ffffff",
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#16223a",
  },
  topSpacer: {
    width: 32,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 98,
  },
  profileHeaderCard: {
    alignItems: "center",
    paddingVertical: 12,
  },
  avatarBorder: {
    width: 102,
    height: 102,
    borderRadius: 51,
    borderWidth: 2,
    borderColor: "#b7ece6",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
  },
  avatarFallback: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "#deefe8",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraBadge: {
    position: "absolute",
    right: -2,
    bottom: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#20d8c4",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  nameText: {
    marginTop: 12,
    fontSize: 31,
    lineHeight: 38,
    fontWeight: "700",
    color: "#15243d",
  },
  premiumChip: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#e6fbf8",
  },
  premiumChipText: {
    color: "#26b9a9",
    fontSize: 13,
    fontWeight: "600",
  },
  memberText: {
    marginTop: 8,
    color: "#97a3b6",
    fontSize: 14,
    fontWeight: "500",
  },
  errorText: {
    marginTop: 8,
    color: "#e55058",
    fontSize: 13,
    textAlign: "center",
  },
  loadingWrap: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
    marginBottom: 12,
  },
  loadingText: {
    marginTop: 8,
    color: "#6f7d92",
    fontSize: 13,
  },
  sectionWrap: {
    marginTop: 8,
  },
  sectionTitle: {
    marginBottom: 8,
    marginLeft: 4,
    color: "#8895a8",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  menuCard: {
    borderRadius: 14,
    backgroundColor: "#ffffff",
    paddingHorizontal: 10,
  },
  menuItem: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  menuIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: "#ecfaf8",
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    flex: 1,
    color: "#1d2b44",
    fontSize: 17,
    fontWeight: "600",
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#edf1f6",
    marginLeft: 44,
  },
  logoutButton: {
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f0d8d8",
    backgroundColor: "#fff4f4",
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  logoutText: {
    color: "#ff4f57",
    fontSize: 25,
    fontWeight: "700",
  },
  tabBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 74,
    borderTopWidth: 1,
    borderTopColor: "#e4e9ef",
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
    fontSize: 11,
    fontWeight: "600",
    color: "#a8b3c3",
  },
  tabTextActive: {
    color: "#24d8c4",
  },
});
