import { StatusBar } from "expo-status-bar";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
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

const MEMBER_SETTINGS = [
  {
    key: "health",
    title: "Hồ sơ sức khỏe của Bố",
    icon: "shield-checkmark-outline",
    bg: "#edf7f0",
    iconColor: "#3f9b6f",
  },
  {
    key: "history",
    title: "Lịch sử uống thuốc của Bố",
    icon: "calendar-outline",
    bg: "#fff4e8",
    iconColor: "#f3a24d",
  },
  {
    key: "reminder",
    title: "Cài đặt nhắc nhở cho Bố",
    icon: "notifications-outline",
    bg: "#f4ecff",
    iconColor: "#9567e8",
  },
  {
    key: "access",
    title: "Quyền truy cập dữ liệu",
    icon: "shield-half-outline",
    bg: "#fff0f1",
    iconColor: "#e15d64",
  },
];

const FAMILY_MEMBERS = [
  { key: "me", label: "Tôi", icon: "person-outline", bg: "#edf7f0", iconColor: "#8fb69e" },
  { key: "father", label: "Bố", icon: "man-outline", bg: "#2d84ff", iconColor: "#ffffff", active: true },
  { key: "mother", label: "Mẹ", icon: "woman-outline", bg: "#f8e7f1", iconColor: "#d07ca7" },
  { key: "child", label: "Con", icon: "happy-outline", bg: "#fdecd8", iconColor: "#db9b58" },
  { key: "other", label: "Khác", icon: "people-outline", bg: "#f1f3f6", iconColor: "#a7afbc" },
];

const toTextOrEmpty = (value) => {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).trim();
};

export default function FamilyMemberProfileScreen({ navigation, route }) {
  const session = route?.params?.session || null;
  const memberId = route?.params?.memberId || null;
  const memberRole = route?.params?.memberRole || "Bố";
  const token = session?.token || process.env.EXPO_PUBLIC_AUTH_TOKEN || "";

  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [member, setMember] = useState({
    caregiver_name: "",
    caregiver_email: "",
    permission: "",
  });

  useEffect(() => {
    let mounted = true;

    const fetchMember = async () => {
      setLoading(true);
      setErrorText("");

      if (!token || !memberId) {
        if (mounted) {
          setErrorText("Không có dữ liệu người thân từ backend.");
          setLoading(false);
        }
        return;
      }

      try {
        const { response, data } = await requestJsonWithFallback(`/api/family-members/${memberId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!mounted) {
          return;
        }

        if (!response.ok) {
          setErrorText(data.message || "Không tải được hồ sơ người thân.");
          setLoading(false);
          return;
        }

        setMember(data?.data || {});
        setLoading(false);
      } catch (_error) {
        if (!mounted) {
          return;
        }
        setErrorText("Không thể kết nối backend để lấy hồ sơ người thân.");
        setLoading(false);
      }
    };

    fetchMember();

    return () => {
      mounted = false;
    };
  }, [memberId, token]);

  const memberName = toTextOrEmpty(member?.caregiver_name) || toTextOrEmpty(route?.params?.memberName);
  const permissionLabel = toTextOrEmpty(member?.permission) ? member.permission.toUpperCase() : "NGƯỜI PHỤ THUỘC";

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <Pressable style={styles.headerIcon} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={22} color="#516070" />
            </Pressable>

            <View style={styles.headerTextWrap}>
              <Text style={styles.headerTitle}>
                {memberRole}{memberName ? ` - ${memberName}` : ""}
              </Text>
              <Text style={styles.headerSubtitle}>Hồ sơ người thân</Text>
            </View>

            <Pressable style={styles.headerIcon}>
              <Ionicons name="settings-outline" size={20} color="#607086" />
            </Pressable>
          </View>

          <View style={styles.profileCard}>
            <View style={[styles.avatarWrap, styles.avatarWrapFather]}>
              <Ionicons name="man-outline" size={24} color="#ffffff" />
              <View style={styles.avatarDot} />
            </View>

            <View style={styles.profileBody}>
              <View style={styles.nameRow}>
                <Text style={styles.nameText}>{memberRole}</Text>
                <View style={styles.dependentBadge}>
                  <Text style={styles.dependentBadgeText}>{permissionLabel}</Text>
                </View>
              </View>
              {!!memberName && <Text style={styles.metaText}>{memberName}</Text>}
              {!!member?.caregiver_email && <Text style={styles.metaText}>{member.caregiver_email}</Text>}
            </View>

            <Pressable style={styles.editPill}>
              <Ionicons name="create-outline" size={16} color="#1f8d63" />
            </Pressable>
          </View>

          {!!loading && (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color="#2d84ff" />
              <Text style={styles.loadingText}>Đang tải hồ sơ người thân...</Text>
            </View>
          )}

          {!!errorText && !loading && <Text style={styles.errorText}>{errorText}</Text>}

          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>HỒ SƠ GIA ĐÌNH</Text>
            <Pressable style={styles.addButton}>
              <Ionicons name="add-circle-outline" size={14} color="#3b9c6f" />
              <Text style={styles.addText}>Thêm mới</Text>
            </Pressable>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.familyRow}>
            {FAMILY_MEMBERS.map((item) => (
              <Pressable
                key={item.key}
                style={styles.familyItem}
                onPress={() => {
                  if (item.key === "me") {
                    navigation.goBack();
                  }
                }}
              >
                <View
                  style={[
                    styles.familyAvatar,
                    item.active && styles.familyAvatarActive,
                    { backgroundColor: item.bg },
                  ]}
                >
                  <Ionicons name={item.icon} size={18} color={item.iconColor} />
                </View>
                <Text style={[styles.familyLabel, item.active && styles.familyLabelActive]}>{item.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.sectionTitle}>CHI TIẾT SỨC KHỎE CỦA BỐ</Text>

          <View style={styles.settingsWrap}>
            {MEMBER_SETTINGS.map((item, index) => (
              <View key={item.key}>
                <Pressable style={styles.settingItem}>
                  <View style={[styles.settingIconWrap, { backgroundColor: item.bg }]}>
                    <Ionicons name={item.icon} size={18} color={item.iconColor} />
                  </View>
                  <Text style={styles.settingText}>{item.title}</Text>
                  <Ionicons name="chevron-forward" size={18} color="#96a2b4" />
                </Pressable>
                {index < MEMBER_SETTINGS.length - 1 ? <View style={styles.settingDivider} /> : null}
              </View>
            ))}
          </View>

          <Pressable style={styles.deleteButton}>
            <MaterialCommunityIcons name="account-remove-outline" size={18} color="#dd6666" />
            <Text style={styles.deleteText}>Bỏ theo dõi hồ sơ này</Text>
          </Pressable>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f2f4f6",
  },
  screen: {
    flex: 1,
    backgroundColor: "#f2f4f6",
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
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  headerTextWrap: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    color: "#172740",
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 14,
    color: "#8a98ab",
  },
  profileCard: {
    marginTop: 18,
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
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  avatarWrapFather: {
    backgroundColor: "#2d84ff",
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
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700",
    color: "#172740",
  },
  dependentBadge: {
    paddingHorizontal: 8,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#e7f0ff",
    alignItems: "center",
    justifyContent: "center",
  },
  dependentBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#4b75c8",
  },
  metaText: {
    marginTop: 4,
    fontSize: 13,
    color: "#7888a0",
  },
  loadingWrap: {
    marginTop: 10,
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
  errorText: {
    marginTop: 10,
    color: "#e24f56",
    fontSize: 14,
  },
  editPill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#edf8f1",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHead: {
    marginTop: 18,
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
    marginTop: 10,
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
    borderColor: "#75a6ff",
  },
  familyLabel: {
    marginTop: 5,
    fontSize: 12,
    color: "#96a3b6",
  },
  familyLabelActive: {
    color: "#2d84ff",
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
  settingDivider: {
    height: 1,
    backgroundColor: "#edf1f6",
    marginLeft: 40,
  },
  deleteButton: {
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
  deleteText: {
    color: "#dd6666",
    fontSize: 18,
    fontWeight: "700",
  },
});
