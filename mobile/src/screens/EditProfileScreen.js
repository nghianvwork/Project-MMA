import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { requestJsonWithFallback } from "../utils/apiClient";

const GENDER_OPTIONS = ["Nam", "Nữ", "Khác"];

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

  return age >= 0 ? String(age) : "";
};

const genderFromApi = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "male" || normalized === "nam") {
    return "Nam";
  }
  if (normalized === "female" || normalized === "nữ" || normalized === "nu") {
    return "Nữ";
  }
  if (normalized === "other" || normalized === "khác" || normalized === "khac") {
    return "Khác";
  }
  return "";
};

const genderToApi = (value) => {
  if (value === "Nam" || value === "Nữ" || value === "Khác") {
    return value;
  }
  return "";
};

export default function EditProfileScreen({ route, navigation }) {
  const session = route?.params?.session || null;
  const token = session?.token || process.env.EXPO_PUBLIC_AUTH_TOKEN || "";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async () => {
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
        const { response, data } = await requestJsonWithFallback("/api/user/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!mounted) {
          return;
        }

        if (!response.ok) {
          setErrorText(data.message || "Không tải được hồ sơ.");
          setLoading(false);
          return;
        }

        setFullName(toTextOrEmpty(data.display_name));
        setAge(getAgeFromDob(data.dob));
        setGender(genderFromApi(data.gender));
        setHeight(toTextOrEmpty(data.height_cm));
        setWeight(toTextOrEmpty(data.weight_kg));
        setLoading(false);
      } catch (_error) {
        if (!mounted) {
          return;
        }
        setErrorText("Không thể kết nối backend để tải hồ sơ.");
        setLoading(false);
      }
    };

    fetchProfile();

    return () => {
      mounted = false;
    };
  }, [token]);

  const handleSave = async () => {
    if (saving) {
      return;
    }

    setErrorText("");
    setSuccessText("");

    if (!fullName.trim()) {
      setErrorText("Vui lòng nhập họ và tên.");
      return;
    }

    if (!token) {
      setErrorText("Chưa có token đăng nhập.");
      return;
    }

    setSaving(true);

    try {
      const { response, data } = await requestJsonWithFallback("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: fullName.trim(),
          gender: genderToApi(gender),
          height: height.trim() ? Number(height) : null,
          weight: weight.trim() ? Number(weight) : null,
        }),
      });

      if (!response.ok) {
        setErrorText(data.message || "Không thể lưu hồ sơ.");
        return;
      }

      setSuccessText("Lưu thay đổi thành công.");
      navigation.goBack();
    } catch (_error) {
      setErrorText("Không thể kết nối backend để cập nhật hồ sơ.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Hủy</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Chỉnh sửa Hồ sơ</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.avatarWrap}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person-outline" size={40} color="#4b9f74" />
            </View>
            <View style={styles.cameraBadge}>
              <Ionicons name="camera-outline" size={14} color="#ffffff" />
            </View>
          </View>

          {!!loading && (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color="#2e8b58" />
              <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
            </View>
          )}

          {!!errorText && !loading && <Text style={styles.errorText}>{errorText}</Text>}
          {!!successText && !loading && <Text style={styles.successText}>{successText}</Text>}

          <Text style={styles.sectionLabel}>THÔNG TIN CƠ BẢN</Text>

          <Text style={styles.inputLabel}>Họ và tên</Text>
          <View style={styles.inputBox}>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Nhập họ và tên"
              placeholderTextColor="#b0b7c3"
              style={styles.input}
            />
            <Ionicons name="create-outline" size={16} color="#9aa4b2" />
          </View>

          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.inputLabel}>Tuổi</Text>
              <View style={styles.inputBox}>
                <TextInput
                  value={age}
                  editable={false}
                  placeholder=""
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.half}>
              <Text style={styles.inputLabel}>Giới tính</Text>
              <View style={styles.genderRow}>
                {GENDER_OPTIONS.map((option) => {
                  const active = option === gender;
                  return (
                    <Pressable
                      key={option}
                      style={[styles.genderChip, active && styles.genderChipActive]}
                      onPress={() => setGender(option)}
                    >
                      <Text style={[styles.genderChipText, active && styles.genderChipTextActive]}>
                        {option}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          <Text style={styles.sectionLabel}>CHỈ SỐ SỨC KHỎE</Text>

          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.inputLabel}>Chiều cao (cm)</Text>
              <View style={styles.inputBox}>
                <TextInput
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#b0b7c3"
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.half}>
              <Text style={styles.inputLabel}>Cân nặng (kg)</Text>
              <View style={styles.inputBox}>
                <TextInput
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#b0b7c3"
                  style={styles.input}
                />
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving || loading}
          >
            {saving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  screen: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  header: {
    height: 56,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cancelButton: {
    minWidth: 42,
    justifyContent: "center",
  },
  cancelText: {
    fontSize: 16,
    color: "#7b8a93",
    fontWeight: "500",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1b2740",
  },
  headerSpacer: {
    width: 42,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 120,
  },
  avatarWrap: {
    alignItems: "center",
    marginTop: 6,
    marginBottom: 20,
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#edf7f0",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraBadge: {
    position: "absolute",
    right: "36%",
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#2e8b58",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  loadingWrap: {
    alignItems: "center",
    paddingVertical: 10,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: "#8692a0",
  },
  errorText: {
    marginBottom: 10,
    color: "#dc4b55",
    fontSize: 14,
  },
  successText: {
    marginBottom: 10,
    color: "#2e8b58",
    fontSize: 14,
  },
  sectionLabel: {
    marginTop: 8,
    marginBottom: 12,
    fontSize: 12,
    fontWeight: "700",
    color: "#9ca5b4",
    letterSpacing: 0.6,
  },
  inputLabel: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#42506a",
  },
  inputBox: {
    height: 50,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e6ebf1",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#1d2942",
  },
  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 18,
  },
  half: {
    flex: 1,
  },
  genderRow: {
    flexDirection: "row",
    gap: 8,
  },
  genderChip: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e6ebf1",
    alignItems: "center",
    justifyContent: "center",
  },
  genderChipActive: {
    backgroundColor: "#edf7f0",
    borderColor: "#2e8b58",
  },
  genderChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#576172",
  },
  genderChipTextActive: {
    color: "#2e8b58",
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: "#f5f7fa",
  },
  saveButton: {
    height: 54,
    borderRadius: 18,
    backgroundColor: "#2e8b58",
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonDisabled: {
    opacity: 0.75,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#ffffff",
  },
});
