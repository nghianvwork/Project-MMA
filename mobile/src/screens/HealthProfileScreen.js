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

const EMPTY_HEALTH_PROFILE = {
  bmi: "",
  bmiStatus: "",
  heightCm: "",
  weightKg: "",
  conditions: [],
  allergies: [],
  surgeries: [],
};

const toTextOrEmpty = (value) => {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).trim();
};

const toNumberOrEmpty = (value) => {
  if (value === null || value === undefined || value === "") {
    return "";
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : "";
};

const getBmiStatus = (bmi) => {
  if (!Number.isFinite(bmi) || bmi <= 0) {
    return "";
  }
  if (bmi < 18.5) return "Thiếu cân";
  if (bmi < 25) return "Bình thường";
  if (bmi < 30) return "Thừa cân";
  return "Béo phì";
};

const normalizeHealthProfile = (profileData) => {
  const heightCm = toNumberOrEmpty(profileData?.height_cm);
  const weightKg = toNumberOrEmpty(profileData?.weight_kg);
  const bmiFromApi = toNumberOrEmpty(profileData?.bmi);
  const bmi =
    Number.isFinite(bmiFromApi) && bmiFromApi > 0
      ? Number(bmiFromApi.toFixed(1))
      : Number.isFinite(heightCm) && heightCm > 0 && Number.isFinite(weightKg) && weightKg > 0
      ? Number((weightKg / ((heightCm / 100) * (heightCm / 100))).toFixed(1))
      : "";
  const bmiStatusApi = toTextOrEmpty(profileData?.bmi_status);
  const bmiStatus = bmiStatusApi || getBmiStatus(bmi);

  return {
    bmi: bmi === "" ? "" : String(bmi),
    bmiStatus,
    heightCm: heightCm === "" ? "" : String(heightCm),
    weightKg: weightKg === "" ? "" : String(weightKg),
    conditions: Array.isArray(profileData?.conditions) ? profileData.conditions : [],
    allergies: Array.isArray(profileData?.allergies) ? profileData.allergies : [],
    surgeries: Array.isArray(profileData?.surgeries) ? profileData.surgeries : [],
  };
};

const MetricCard = ({ label, value, unit, helper, accentColor }) => (
  <View style={styles.metricCard}>
    <Text style={styles.metricLabel}>{label}</Text>
    <View style={styles.metricValueRow}>
      <Text style={styles.metricValue}>{value || ""}</Text>
      {unit ? <Text style={styles.metricUnit}>{unit}</Text> : null}
    </View>
    <Text style={[styles.metricHelper, accentColor ? { color: accentColor } : null]}>
      {helper || ""}
    </Text>
  </View>
);

const EmptySection = ({ text }) => (
  <View style={styles.emptySectionBox}>
    <Text style={styles.emptyText}>{text}</Text>
  </View>
);

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

const RecordItem = ({ record }) => {
  const title = toTextOrEmpty(record?.title);
  const description = toTextOrEmpty(record?.description);
  const subtitle = formatRecordSubtitle(record);

  return (
    <View style={styles.recordCard}>
      <Text style={styles.recordTitle}>{title}</Text>
      {subtitle ? <Text style={styles.recordMeta}>{subtitle}</Text> : null}
      {description ? <Text style={styles.recordDesc}>{description}</Text> : null}
    </View>
  );
};

export default function HealthProfileScreen({ route, navigation }) {
  const session = route?.params?.session || null;
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [healthProfile, setHealthProfile] = useState({ ...EMPTY_HEALTH_PROFILE });

  const token = session?.token || process.env.EXPO_PUBLIC_AUTH_TOKEN || "";

  useEffect(() => {
    let mounted = true;

    const fetchHealthProfile = async () => {
      setLoading(true);
      setErrorText("");

      if (!token) {
        if (mounted) {
          setHealthProfile({ ...EMPTY_HEALTH_PROFILE });
          setErrorText("Chưa có token đăng nhập.");
          setLoading(false);
        }
        return;
      }

      try {
        const { response, data } = await requestJsonWithFallback("/api/health-profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!mounted) {
          return;
        }

        if (!response.ok) {
          setHealthProfile({ ...EMPTY_HEALTH_PROFILE });
          setErrorText(data.message || "Không tải được hồ sơ sức khỏe.");
          setLoading(false);
          return;
        }

        const normalized = normalizeHealthProfile(data?.data || data);
        setHealthProfile(normalized);
        setLoading(false);
      } catch (_error) {
        if (!mounted) {
          return;
        }
        setHealthProfile({ ...EMPTY_HEALTH_PROFILE });
        setErrorText("Không thể kết nối backend để lấy hồ sơ sức khỏe.");
        setLoading(false);
      }
    };

    fetchHealthProfile();

    return () => {
      mounted = false;
    };
  }, [token]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#5b6474" />
          </Pressable>
          <Text style={styles.headerTitle}>Hồ sơ sức khỏe</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color="#2f8b5f" />
              <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
            </View>
          ) : null}

          {!!errorText && !loading ? <Text style={styles.errorText}>{errorText}</Text> : null}

          <View style={styles.metricsRow}>
            <MetricCard
              label="BMI"
              value={healthProfile.bmi}
              helper={healthProfile.bmiStatus}
              accentColor="#47a66d"
            />
            <MetricCard label="CHIỀU CAO" value={healthProfile.heightCm} unit="cm" />
            <MetricCard label="CÂN NẶNG" value={healthProfile.weightKg} unit="kg" />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <MaterialCommunityIcons name="stethoscope" size={16} color="#6486d8" />
              <Text style={styles.sectionTitle}>Bệnh lý nền</Text>
            </View>
            {healthProfile.conditions.length === 0 ? (
              <EmptySection text="Chưa có dữ liệu bệnh lý nền." />
            ) : (
              healthProfile.conditions.map((item) => (
                <RecordItem key={`condition-${item.id || item.title}`} record={item} />
              ))
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="warning-outline" size={16} color="#ef6f62" />
              <Text style={styles.sectionTitle}>Dị ứng</Text>
            </View>
            {healthProfile.allergies.length === 0 ? (
              <EmptySection text="Chưa có dữ liệu dị ứng." />
            ) : (
              healthProfile.allergies.map((item) => (
                <RecordItem key={`allergy-${item.id || item.title}`} record={item} />
              ))
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <MaterialCommunityIcons name="star-four-points-outline" size={16} color="#b35ce0" />
              <Text style={styles.sectionTitle}>Tiền sử phẫu thuật</Text>
            </View>
            {healthProfile.surgeries.length === 0 ? (
              <View style={styles.historyEmpty}>
                <Text style={styles.emptyText}>Chưa có dữ liệu tiền sử phẫu thuật.</Text>
              </View>
            ) : (
              healthProfile.surgeries.map((item) => (
                <RecordItem key={`surgery-${item.id || item.title}`} record={item} />
              ))
            )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={styles.updateButton}
            onPress={() => navigation.navigate("EditHealthProfile", { session })}
          >
            <MaterialCommunityIcons name="stethoscope" size={18} color="#ffffff" />
            <Text style={styles.updateButtonText}>Cập nhật chỉ số</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f6f8fb",
  },
  screen: {
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
    fontSize: 22,
    fontWeight: "700",
    color: "#13233f",
  },
  headerSpacer: {
    width: 36,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 120,
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
  metricsRow: {
    flexDirection: "row",
    gap: 10,
  },
  metricCard: {
    flex: 1,
    minHeight: 102,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 14,
    shadowColor: "#000000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#a0a9b6",
    letterSpacing: 0.5,
  },
  metricValueRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  metricValue: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "800",
    color: "#1e2d45",
  },
  metricUnit: {
    marginLeft: 3,
    marginBottom: 3,
    fontSize: 16,
    color: "#7d8796",
    fontWeight: "500",
  },
  metricHelper: {
    marginTop: 8,
    fontSize: 12,
    color: "#96a1af",
    fontWeight: "600",
  },
  section: {
    marginTop: 28,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 25,
    lineHeight: 30,
    fontWeight: "700",
    color: "#24344d",
  },
  emptyText: {
    fontSize: 15,
    color: "#98a1af",
  },
  emptySectionBox: {
    borderRadius: 16,
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  historyEmpty: {
    borderRadius: 18,
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  recordCard: {
    borderRadius: 16,
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e2d45",
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
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: "#f6f8fb",
  },
  updateButton: {
    height: 54,
    borderRadius: 16,
    backgroundColor: "#2e8b58",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#2e8b58",
    shadowOpacity: 0.24,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  updateButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#ffffff",
  },
});
