import { StatusBar } from "expo-status-bar";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { requestJsonWithFallback } from "../utils/apiClient";

const EMPTY_PROFILE = {
  displayName: "",
  age: "",
  gender: "",
  bloodType: "",
};

const STATIC_FAMILY_MEMBER = {
  key: "me",
  label: "Tôi",
  icon: "person-outline",
  bg: "#2c8e62",
  iconColor: "#ffffff",
};

const RELATION_OPTIONS = [
  { key: "Bố", label: "Bố", icon: "man-outline", bg: "#e3edff", iconColor: "#7a90d4" },
  { key: "Mẹ", label: "Mẹ", icon: "woman-outline", bg: "#f7e8f1", iconColor: "#d07ca7" },
  { key: "Con", label: "Con", icon: "happy-outline", bg: "#fbead8", iconColor: "#e5a05e" },
  { key: "Khác", label: "Khác", icon: "people-outline", bg: "#eef1f5", iconColor: "#9fa8b5" },
];

const PERMISSION_OPTIONS = [
  { key: "view", label: "Chỉ xem" },
  { key: "edit", label: "Chỉnh sửa" },
];

const FAMILY_ERROR_MESSAGE_MAP = {
  "Cần caregiver_user_id hoặc caregiver_email hợp lệ": "Email người thân không hợp lệ.",
  "Email người thân không hợp lệ": "Email người thân không hợp lệ.",
  "Email người thân đã tồn tại": "Email người thân đã tồn tại trong hệ thống.",
  "Người thân này đã được thêm trước đó": "Người thân này đã được thêm trước đó.",
  "Không thể thêm chính bạn vào danh sách người thân":
    "Không thể dùng chính email tài khoản hiện tại để thêm người thân.",
};

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

const toTextOrEmpty = (value) => {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).trim();
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

const normalizeProfileData = (profileData) => ({
  displayName: toTextOrEmpty(profileData?.display_name),
  age: getAgeFromDob(profileData?.dob),
  gender: toGenderText(profileData?.gender),
  bloodType: toTextOrEmpty(profileData?.blood_type),
});

const mapFamilyMemberToUi = (member) => {
  const relation = toTextOrEmpty(member?.relation);
  if (!relation || relation === "Khác") {
    return null;
  }

  const config =
    RELATION_OPTIONS.find((item) => item.label === relation) ||
    RELATION_OPTIONS.find((item) => item.label === "Khác");

  return {
    key: `family-${member.id}`,
    relation,
    label: relation,
    icon: config?.icon || "people-outline",
    bg: config?.bg || "#eef1f5",
    iconColor: config?.iconColor || "#9fa8b5",
    active: false,
    memberId: member.id,
    memberName: toTextOrEmpty(member?.caregiver_name),
    permission: toTextOrEmpty(member?.permission),
  };
};

export default function ProfileScreen(props) {
  const session = props?.route?.params?.session || props?.session || null;
  const onLogout = props?.route?.params?.onLogout || props?.onLogout;
  const navigation = props?.navigation;
  const token = session?.token || process.env.EXPO_PUBLIC_AUTH_TOKEN || "";
  const currentUserEmail = String(session?.user?.email || "").trim().toLowerCase();

  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [profile, setProfile] = useState({ ...EMPTY_PROFILE });
  const [historyStats, setHistoryStats] = useState({ scheduleTotal: 0, medicineTotal: 0 });
  const [familyMembers, setFamilyMembers] = useState([]);
  const [selectedMemberKey, setSelectedMemberKey] = useState("me");

  const [familyModalVisible, setFamilyModalVisible] = useState(false);
  const [familyEmail, setFamilyEmail] = useState("");
  const [familyRelation, setFamilyRelation] = useState("Bố");
  const [familyPermission, setFamilyPermission] = useState("view");
  const [familySubmitting, setFamilySubmitting] = useState(false);
  const [familyErrorText, setFamilyErrorText] = useState("");

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      setLoading(true);
      setErrorText("");

      if (!token) {
        if (mounted) {
          setErrorText("Chưa có token đăng nhập.");
          setLoading(false);
        }
        return;
      }

      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [profileResult, medicineResult, scheduleResult, familyResult] = await Promise.all([
          requestJsonWithFallback("/api/user/profile", { headers }),
          requestJsonWithFallback("/api/medicines", { headers }),
          requestJsonWithFallback("/api/schedules", { headers }),
          requestJsonWithFallback("/api/family-members", { headers }),
        ]);

        if (!mounted) {
          return;
        }

        if (!profileResult.response.ok) {
          setErrorText(profileResult.data.message || "Không tải được hồ sơ từ backend.");
          setLoading(false);
          return;
        }

        setProfile(normalizeProfileData(profileResult.data));
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

        const familyItems =
          familyResult.response.ok && Array.isArray(familyResult.data?.data)
            ? familyResult.data.data
            : [];
        setFamilyMembers(familyItems);
        setLoading(false);
      } catch (_error) {
        if (!mounted) {
          return;
        }
        setErrorText("Không thể kết nối backend để lấy hồ sơ.");
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [token]);

  const identityText = useMemo(() => {
    const parts = [];
    if (profile.age !== "") parts.push(`${profile.age} tuổi`);
    if (profile.gender) parts.push(profile.gender);
    if (profile.bloodType) parts.push(`Nhóm máu ${profile.bloodType}`);
    return parts.join(" • ");
  }, [profile.age, profile.gender, profile.bloodType]);

  const scheduleHintText = historyStats.scheduleTotal > 0 ? `${historyStats.scheduleTotal} lịch` : "";

  const familyItems = useMemo(() => {
    return [
      STATIC_FAMILY_MEMBER,
      ...familyMembers.map(mapFamilyMemberToUi).filter(Boolean),
    ];
  }, [familyMembers]);

  const selectedFamilyItem = useMemo(() => {
    return familyItems.find((item) => item.key === selectedMemberKey) || familyItems[0];
  }, [familyItems, selectedMemberKey]);

  const isViewingSelf = selectedFamilyItem?.key === "me";
  const selectedRelationLabel = isViewingSelf
    ? ""
    : selectedFamilyItem?.label || "";

  const headerName = isViewingSelf
    ? profile.displayName
    : selectedFamilyItem?.memberName || selectedFamilyItem?.label || "";

  const headerMeta = isViewingSelf
    ? identityText
    : selectedFamilyItem?.label
      ? `${selectedFamilyItem.label}${selectedFamilyItem.permission ? ` • ${selectedFamilyItem.permission}` : ""}`
      : "";

  const settingsTitleForSelectedMember = (baseTitle) => {
    if (isViewingSelf || !selectedRelationLabel) {
      return baseTitle;
    }
    return `${baseTitle} của ${selectedRelationLabel}`;
  };

  const settingsSectionTitle = isViewingSelf
    ? "THÔNG TIN & CÀI ĐẶT"
    : `THÔNG TIN & CÀI ĐẶT CỦA ${selectedRelationLabel.toUpperCase()}`;
  const displayedScheduleHintText = isViewingSelf ? scheduleHintText : "";

  const closeFamilyModal = () => {
    setFamilyModalVisible(false);
    setFamilyEmail("");
    setFamilyRelation("Bố");
    setFamilyPermission("view");
    setFamilyErrorText("");
  };

  const handleCreateFamilyMember = async () => {
    if (familySubmitting) {
      return;
    }

    setFamilyErrorText("");

    if (!familyEmail.trim()) {
      setFamilyErrorText("Vui lòng nhập email người thân.");
      return;
    }

    const normalizedFamilyEmail = familyEmail.trim().toLowerCase();
    if (currentUserEmail && normalizedFamilyEmail === currentUserEmail) {
      setFamilyErrorText("Không thể dùng chính email tài khoản hiện tại để thêm người thân.");
      return;
    }

    if (!token) {
      setFamilyErrorText("Chưa có token đăng nhập.");
      return;
    }

    setFamilySubmitting(true);

    try {
      const { response, data } = await requestJsonWithFallback("/api/family-members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          caregiver_email: normalizedFamilyEmail,
          relation: familyRelation,
          permission: familyPermission,
        }),
      });

      if (!response.ok) {
        setFamilyErrorText(
          FAMILY_ERROR_MESSAGE_MAP[data.message] || data.message || "Không thể thêm người thân."
        );
        return;
      }

      setFamilyMembers((prev) => [
        {
          ...(data.data || {}),
          relation: toTextOrEmpty(data?.data?.relation) || familyRelation,
        },
        ...prev,
      ]);
      closeFamilyModal();
    } catch (_error) {
      setFamilyErrorText("Không thể kết nối backend để thêm người thân.");
    } finally {
      setFamilySubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.phoneFrame}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
            <View
              style={[
                styles.avatarWrap,
                !isViewingSelf && { backgroundColor: selectedFamilyItem?.bg || "#eef1f5" },
              ]}
            >
              <Ionicons
                name={selectedFamilyItem?.icon || "person-outline"}
                size={24}
                color={isViewingSelf ? "#247a59" : selectedFamilyItem?.iconColor || "#9fa8b5"}
              />
              <View style={styles.avatarDot} />
            </View>

            <View style={styles.profileBody}>
              <Text style={styles.nameText}>{headerName}</Text>
              {headerMeta ? <Text style={styles.metaText}>{headerMeta}</Text> : null}
            </View>

            {isViewingSelf ? (
              <Pressable style={styles.editPill} onPress={() => navigation?.navigate("EditProfile", { session })}>
                <Ionicons name="create-outline" size={16} color="#1f8d63" />
              </Pressable>
            ) : null}
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
            <Pressable style={styles.addButton} onPress={() => setFamilyModalVisible(true)}>
              <Ionicons name="add-circle-outline" size={14} color="#3b9c6f" />
              <Text style={styles.addText}>Thêm mới</Text>
            </Pressable>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.familyRow}>
            {familyItems.map((item) => (
              <Pressable
                key={item.key}
                style={styles.familyItem}
                onPress={() => setSelectedMemberKey(item.key)}
              >
                <View
                  style={[
                    styles.familyAvatar,
                    selectedMemberKey === item.key && styles.familyAvatarActive,
                    { backgroundColor: item.bg },
                  ]}
                >
                  <Ionicons name={item.icon} size={18} color={item.iconColor} />
                </View>
                <Text style={[styles.familyLabel, selectedMemberKey === item.key && styles.familyLabelActive]}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.sectionTitle}>{settingsSectionTitle}</Text>

          <View style={styles.settingsWrap}>
            {SETTING_ITEMS.map((item, index) => (
              <View key={item.key}>
                <Pressable
                  style={styles.settingItem}
                  onPress={() => {
                    if (item.key === "health_profile") {
                      navigation?.navigate("HealthProfile", { session });
                    }
                    if (item.key === "medicine_history") {
                      navigation?.navigate("MedicationHistory", {
                        session,
                        selectedMemberLabel: isViewingSelf ? "Tôi" : selectedRelationLabel,
                        isViewingSelf,
                        memberId: selectedFamilyItem?.memberId || null,
                      });
                    }
                    if (item.key === "notifications") {
                      navigation?.navigate("NotificationSettings", { session });
                    }
                  }}
                >
                  <View style={[styles.settingIconWrap, { backgroundColor: item.bg }]}>
                    <Ionicons name={item.icon} size={18} color={item.iconColor} />
                  </View>
                  <Text style={styles.settingText}>
                    {settingsTitleForSelectedMember(item.title)}
                  </Text>
                  {item.key === "medicine_history" && displayedScheduleHintText ? (
                    <Text style={styles.settingHint}>{displayedScheduleHintText}</Text>
                  ) : null}
                  <Ionicons name="chevron-forward" size={18} color="#96a2b4" />
                </Pressable>
                {index < SETTING_ITEMS.length - 1 ? <View style={styles.settingDivider} /> : null}
              </View>
            ))}
          </View>

          <Pressable style={styles.logoutButton} onPress={() => onLogout?.()}>
            <MaterialCommunityIcons name="logout" size={17} color="#ef4e4e" />
            <Text style={styles.logoutText}>Đăng xuất</Text>
          </Pressable>
        </ScrollView>

        <Modal visible={familyModalVisible} transparent animationType="fade" onRequestClose={closeFamilyModal}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Thêm người thân</Text>

              <Text style={styles.modalLabel}>Mối quan hệ</Text>
              <View style={styles.relationRow}>
                {RELATION_OPTIONS.map((option) => {
                  const active = option.label === familyRelation;
                  return (
                    <Pressable
                      key={option.key}
                      style={[styles.relationChip, active && styles.relationChipActive]}
                      onPress={() => setFamilyRelation(option.label)}
                    >
                      <Text style={[styles.relationChipText, active && styles.relationChipTextActive]}>
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.modalLabel}>Email người thân</Text>
              <View style={styles.modalInput}>
                <TextInput
                  value={familyEmail}
                  onChangeText={setFamilyEmail}
                  placeholder="nhap@email.com"
                  placeholderTextColor="#a8b2bf"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={styles.modalInputText}
                />
              </View>

              <Text style={styles.modalLabel}>Quyền truy cập</Text>
              <View style={styles.permissionRow}>
                {PERMISSION_OPTIONS.map((option) => {
                  const active = option.key === familyPermission;
                  return (
                    <Pressable
                      key={option.key}
                      style={[styles.permissionChip, active && styles.permissionChipActive]}
                      onPress={() => setFamilyPermission(option.key)}
                    >
                      <Text
                        style={[
                          styles.permissionChipText,
                          active && styles.permissionChipTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {!!familyErrorText && <Text style={styles.modalErrorText}>{familyErrorText}</Text>}

              <View style={styles.modalButtonRow}>
                <Pressable style={styles.modalCancelButton} onPress={closeFamilyModal}>
                  <Text style={styles.modalCancelText}>Hủy</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalSaveButton, familySubmitting && styles.modalSaveButtonDisabled]}
                  onPress={handleCreateFamilyMember}
                  disabled={familySubmitting}
                >
                  {familySubmitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.modalSaveText}>Thêm</Text>}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
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
  nameText: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "700",
    color: "#172740",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(17, 24, 39, 0.35)",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  modalCard: {
    borderRadius: 20,
    backgroundColor: "#ffffff",
    padding: 18,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#172740",
    marginBottom: 14,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#42506a",
    marginBottom: 8,
  },
  relationRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  relationChip: {
    minWidth: 64,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e5ebf2",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  relationChipActive: {
    backgroundColor: "#edf8f1",
    borderColor: "#2c8e62",
  },
  relationChipText: {
    color: "#66758a",
    fontSize: 14,
    fontWeight: "600",
  },
  relationChipTextActive: {
    color: "#2c8e62",
  },
  modalInput: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e4eaf1",
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    justifyContent: "center",
    marginBottom: 14,
  },
  modalInputText: {
    fontSize: 15,
    color: "#1d2942",
  },
  permissionRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  permissionChip: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5ebf2",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  permissionChipActive: {
    backgroundColor: "#edf8f1",
    borderColor: "#2c8e62",
  },
  permissionChipText: {
    color: "#66758a",
    fontSize: 14,
    fontWeight: "600",
  },
  permissionChipTextActive: {
    color: "#2c8e62",
  },
  modalErrorText: {
    marginBottom: 10,
    color: "#e24f56",
    fontSize: 14,
  },
  modalButtonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  modalCancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#f3f5f7",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelText: {
    color: "#66758a",
    fontSize: 15,
    fontWeight: "600",
  },
  modalSaveButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#2c8e62",
    alignItems: "center",
    justifyContent: "center",
  },
  modalSaveButtonDisabled: {
    opacity: 0.75,
  },
  modalSaveText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
});
