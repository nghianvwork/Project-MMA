import { StatusBar } from "expo-status-bar";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import {
  createHealthRecord,
  deleteHealthRecord,
  updateHealthRecord,
} from "../api/healthRecordApi";

const CATEGORY_CONFIG = {
  conditions: { label: "Bệnh lý nền", category: "underlying", icon: "stethoscope" },
  allergies: { label: "Dị ứng", category: "allergy", icon: "warning-outline" },
  surgeries: { label: "Tiền sử phẫu thuật", category: "surgery", icon: "star-four-points-outline" },
};

const toTextOrEmpty = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatRecordSubtitle = (record) => {
  const parts = [];
  const diagnosed = formatDate(record?.diagnosed_date);
  if (diagnosed) parts.push(diagnosed);
  const hospital = toTextOrEmpty(record?.hospital);
  if (hospital) parts.push(hospital);
  const severity = toTextOrEmpty(record?.severity);
  if (severity) parts.push(severity);
  return parts.join(" • ");
};

const EMPTY_FORM = {
  id: null,
  categoryKey: "conditions",
  title: "",
  description: "",
  diagnosed_date: "",
  hospital: "",
  severity: "",
};

export default function EditHealthProfileScreen({ route, navigation }) {
  const session = route?.params?.session || null;
  const token = session?.token || process.env.EXPO_PUBLIC_AUTH_TOKEN || "";

  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [metricHeight, setMetricHeight] = useState("");
  const [metricWeight, setMetricWeight] = useState("");
  const [savingMetrics, setSavingMetrics] = useState(false);
  const [conditions, setConditions] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [surgeries, setSurgeries] = useState([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const refreshProfile = async () => {
    setLoading(true);
    setErrorText("");

    if (!token) {
      setErrorText("Chưa có token đăng nhập.");
      setLoading(false);
      return;
    }

    try {
      const profileResult = await requestJsonWithFallback("/api/user/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (profileResult.response.ok) {
        const profileData = profileResult.data || {};
        setMetricHeight(
          profileData?.height_cm !== null && profileData?.height_cm !== undefined
            ? String(profileData.height_cm)
            : "",
        );
        setMetricWeight(
          profileData?.weight_kg !== null && profileData?.weight_kg !== undefined
            ? String(profileData.weight_kg)
            : "",
        );
      }

      const { response, data } = await requestJsonWithFallback("/api/health-profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        setErrorText(data.message || "Không tải được hồ sơ bệnh.");
        setLoading(false);
        return;
      }

      const payload = data?.data || data;
      setConditions(Array.isArray(payload?.conditions) ? payload.conditions : []);
      setAllergies(Array.isArray(payload?.allergies) ? payload.allergies : []);
      setSurgeries(Array.isArray(payload?.surgeries) ? payload.surgeries : []);
      setLoading(false);
    } catch (_error) {
      setErrorText("Không thể kết nối backend.");
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, [token]);

  const openCreateModal = (categoryKey) => {
    setForm({ ...EMPTY_FORM, categoryKey });
    setModalVisible(true);
  };

  const openEditModal = (categoryKey, record) => {
    setForm({
      id: record?.id ?? null,
      categoryKey,
      title: toTextOrEmpty(record?.title),
      description: toTextOrEmpty(record?.description),
      diagnosed_date: record?.diagnosed_date ? String(record.diagnosed_date).slice(0, 10) : "",
      hospital: toTextOrEmpty(record?.hospital),
      severity: toTextOrEmpty(record?.severity),
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      Alert.alert("Thiếu dữ liệu", "Vui lòng nhập tiêu đề.");
      return;
    }

    const config = CATEGORY_CONFIG[form.categoryKey];
    const payload = {
      category: config?.category || "underlying",
      title: form.title.trim(),
      description: form.description.trim() || null,
      diagnosed_date: form.diagnosed_date.trim() || null,
      hospital: form.hospital.trim() || null,
      severity: form.severity.trim() || null,
    };

    setSaving(true);
    try {
      if (form.id) {
        await updateHealthRecord(form.id, payload);
      } else {
        await createHealthRecord(payload);
      }
      setModalVisible(false);
      setForm({ ...EMPTY_FORM, categoryKey: form.categoryKey });
      await refreshProfile();
    } catch (error) {
      Alert.alert("Lỗi", error?.message || "Không thể lưu hồ sơ.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (record) => {
    Alert.alert("Xóa mục này?", "Dữ liệu sẽ bị xóa khỏi hồ sơ sức khỏe.", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteHealthRecord(record.id);
            await refreshProfile();
          } catch (error) {
            Alert.alert("Lỗi", error?.message || "Không thể xóa.");
          }
        },
      },
    ]);
  };

  const handleSaveMetrics = async () => {
    const heightValue = metricHeight.trim();
    const weightValue = metricWeight.trim();

    if (heightValue && Number.isNaN(Number(heightValue))) {
      Alert.alert("Sai dữ liệu", "Chiều cao phải là số.");
      return;
    }
    if (weightValue && Number.isNaN(Number(weightValue))) {
      Alert.alert("Sai dữ liệu", "Cân nặng phải là số.");
      return;
    }

    setSavingMetrics(true);
    try {
      const payload = {
        height: heightValue === "" ? null : Number(heightValue),
        weight: weightValue === "" ? null : Number(weightValue),
      };

      const { response, data } = await requestJsonWithFallback("/api/user/profile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(data?.message || "Không thể cập nhật chỉ số.");
      }

      await refreshProfile();
      Alert.alert("Thành công", "Đã cập nhật chiều cao & cân nặng.");
    } catch (error) {
      Alert.alert("Lỗi", error?.message || "Không thể cập nhật chỉ số.");
    } finally {
      setSavingMetrics(false);
    }
  };

  const sections = useMemo(
    () => [
      { key: "conditions", data: conditions },
      { key: "allergies", data: allergies },
      { key: "surgeries", data: surgeries },
    ],
    [conditions, allergies, surgeries],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#5b6474" />
        </Pressable>
        <Text style={styles.headerTitle}>Cập nhật hồ sơ bệnh</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color="#2f8b5f" />
            <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
          </View>
        ) : null}

        {!!errorText && !loading ? <Text style={styles.errorText}>{errorText}</Text> : null}

        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <MaterialCommunityIcons name="scale-bathroom" size={16} color="#2e8b58" />
            <Text style={styles.sectionTitle}>Chỉ số cơ thể</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.row}>
              <View style={styles.flexItem}>
                <Text style={styles.inputLabel}>Chiều cao (cm)</Text>
                <TextInput
                  style={styles.input}
                  value={metricHeight}
                  onChangeText={setMetricHeight}
                  keyboardType="numeric"
                  placeholder="160"
                  placeholderTextColor="#97a3b3"
                />
              </View>
              <View style={styles.flexItem}>
                <Text style={styles.inputLabel}>Cân nặng (kg)</Text>
                <TextInput
                  style={styles.input}
                  value={metricWeight}
                  onChangeText={setMetricWeight}
                  keyboardType="numeric"
                  placeholder="65"
                  placeholderTextColor="#97a3b3"
                />
              </View>
            </View>

            <Pressable
              style={[styles.metricSaveButton, savingMetrics && styles.metricSaveDisabled]}
              onPress={handleSaveMetrics}
              disabled={savingMetrics}
            >
              {savingMetrics ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.metricSaveText}>Lưu chỉ số</Text>
              )}
            </Pressable>
          </View>
        </View>

        {sections.map((section) => {
          const config = CATEGORY_CONFIG[section.key];
          const sectionLabel = config?.label || section.key;
          return (
            <View key={section.key} style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <MaterialCommunityIcons
                  name={config?.icon || "stethoscope"}
                  size={16}
                  color="#6486d8"
                />
                <Text style={styles.sectionTitle}>{sectionLabel}</Text>
                <Pressable
                  style={styles.addButton}
                  onPress={() => openCreateModal(section.key)}
                >
                  <Ionicons name="add-circle-outline" size={18} color="#2e8b58" />
                  <Text style={styles.addButtonText}>Thêm</Text>
                </Pressable>
              </View>

              {section.data.length === 0 ? (
                <View style={styles.emptySectionBox}>
                  <Text style={styles.emptyText}>Chưa có dữ liệu.</Text>
                </View>
              ) : (
                section.data.map((record) => (
                  <View key={`${section.key}-${record.id}`} style={styles.recordCard}>
                    <View style={styles.recordHeader}>
                      <Text style={styles.recordTitle}>{toTextOrEmpty(record.title)}</Text>
                      <View style={styles.recordActions}>
                        <Pressable
                          style={styles.recordAction}
                          onPress={() => openEditModal(section.key, record)}
                        >
                          <Ionicons name="create-outline" size={16} color="#2f7b5a" />
                        </Pressable>
                        <Pressable
                          style={styles.recordAction}
                          onPress={() => handleDelete(record)}
                        >
                          <Ionicons name="trash-outline" size={16} color="#d35b5b" />
                        </Pressable>
                      </View>
                    </View>
                    {formatRecordSubtitle(record) ? (
                      <Text style={styles.recordMeta}>{formatRecordSubtitle(record)}</Text>
                    ) : null}
                    {record.description ? (
                      <Text style={styles.recordDesc}>{toTextOrEmpty(record.description)}</Text>
                    ) : null}
                  </View>
                ))
              )}
            </View>
          );
        })}
      </ScrollView>

      <Modal transparent visible={modalVisible} animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {form.id ? "Sửa mục hồ sơ" : "Thêm mục hồ sơ"}
            </Text>

            <Text style={styles.inputLabel}>Tiêu đề *</Text>
            <TextInput
              style={styles.input}
              value={form.title}
              onChangeText={(value) => setForm((prev) => ({ ...prev, title: value }))}
              placeholder="Ví dụ: Tăng huyết áp"
              placeholderTextColor="#97a3b3"
            />

            <Text style={styles.inputLabel}>Mô tả</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={form.description}
              onChangeText={(value) => setForm((prev) => ({ ...prev, description: value }))}
              placeholder="Ghi chú thêm..."
              placeholderTextColor="#97a3b3"
              multiline
            />

            <View style={styles.row}>
              <View style={styles.flexItem}>
                <Text style={styles.inputLabel}>Ngày chẩn đoán</Text>
                <TextInput
                  style={styles.input}
                  value={form.diagnosed_date}
                  onChangeText={(value) =>
                    setForm((prev) => ({ ...prev, diagnosed_date: value }))
                  }
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#97a3b3"
                />
              </View>
              <View style={styles.flexItem}>
                <Text style={styles.inputLabel}>Mức độ</Text>
                <TextInput
                  style={styles.input}
                  value={form.severity}
                  onChangeText={(value) => setForm((prev) => ({ ...prev, severity: value }))}
                  placeholder="Nhẹ/Trung bình..."
                  placeholderTextColor="#97a3b3"
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>Bệnh viện</Text>
            <TextInput
              style={styles.input}
              value={form.hospital}
              onChangeText={(value) => setForm((prev) => ({ ...prev, hospital: value }))}
              placeholder="BV..."
              placeholderTextColor="#97a3b3"
            />

            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancel} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancelText}>Hủy</Text>
              </Pressable>
              <Pressable style={styles.modalSave} onPress={handleSave} disabled={saving}>
                {saving ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.modalSaveText}>Lưu</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f6f8fb",
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#13233f",
  },
  headerSpacer: {
    width: 36,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 40,
  },
  loadingWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: "#7d8898",
  },
  errorText: {
    marginBottom: 10,
    fontSize: 14,
    color: "#de4f58",
  },
  section: {
    marginTop: 18,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: "#24344d",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addButtonText: {
    fontSize: 14,
    color: "#2e8b58",
    fontWeight: "700",
  },
  emptySectionBox: {
    borderRadius: 16,
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  emptyText: {
    fontSize: 14,
    color: "#98a1af",
  },
  recordCard: {
    borderRadius: 16,
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
  },
  recordHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e2d45",
    flex: 1,
  },
  recordMeta: {
    marginTop: 4,
    fontSize: 12,
    color: "#8c99ab",
    fontWeight: "600",
  },
  recordDesc: {
    marginTop: 6,
    fontSize: 13,
    color: "#6c7a8c",
  },
  recordActions: {
    flexDirection: "row",
    gap: 8,
    marginLeft: 12,
  },
  metricCard: {
    borderRadius: 16,
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  metricSaveButton: {
    marginTop: 6,
    alignSelf: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#2e8b58",
  },
  metricSaveDisabled: {
    opacity: 0.7,
  },
  metricSaveText: {
    fontWeight: "700",
    color: "#ffffff",
  },
  recordAction: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#f1f5f8",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 25, 40, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    borderRadius: 18,
    backgroundColor: "#ffffff",
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e2d45",
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#5b6b7d",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e3e8ef",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#1e2d45",
    backgroundColor: "#f9fbfd",
    marginBottom: 10,
  },
  inputMultiline: {
    minHeight: 70,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  flexItem: {
    flex: 1,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 6,
  },
  modalCancel: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#edf1f6",
  },
  modalCancelText: {
    fontWeight: "700",
    color: "#5b6b7d",
  },
  modalSave: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#2e8b58",
  },
  modalSaveText: {
    fontWeight: "700",
    color: "#ffffff",
  },
});
