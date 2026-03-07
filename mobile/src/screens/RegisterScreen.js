import { StatusBar } from "expo-status-bar";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import {
  formatApiBaseCandidates,
  requestJsonWithFallback,
} from "../utils/apiClient";

const GENDER_OPTIONS = ["Nam", "Nữ", "Khác"];

const VN_REGISTER_MESSAGE = {
  "Missing required fields": "Thiếu thông tin bắt buộc.",
  "Email already exists": "Email đã tồn tại.",
  "Register success": "Tạo tài khoản thành công.",
  "Missing email or password": "Thiếu email hoặc mật khẩu.",
  "Invalid email or password": "Email hoặc mật khẩu không đúng.",
  "Server error": "Lỗi máy chủ.",
};

const toVietnameseMessage = (message, fallback) => {
  if (!message) {
    return fallback;
  }
  return VN_REGISTER_MESSAGE[message] || message;
};

const parseDobToIso = (inputValue) => {
  const value = (inputValue || "").trim();
  if (!value) {
    return "";
  }

  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  const slashMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!slashMatch) {
    return "";
  }

  const day = Number(slashMatch[1]);
  const month = Number(slashMatch[2]);
  const year = Number(slashMatch[3]);
  const date = new Date(year, month - 1, day);
  const valid =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;

  if (!valid) {
    return "";
  }

  return `${year}-${`${month}`.padStart(2, "0")}-${`${day}`.padStart(2, "0")}`;
};

const isPositiveNumber = (value) => {
  if (!value) {
    return true;
  }
  const number = Number(value);
  return Number.isFinite(number) && number > 0;
};

export default function RegisterScreen({ onSwitchToLogin, onBackToWelcome }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleRegister = async () => {
    if (isSubmitting) {
      return;
    }

    const nameValue = fullName.trim();
    const emailValue = email.trim().toLowerCase();
    const passwordValue = password.trim();
    const confirmPasswordValue = confirmPassword.trim();
    const dobIso = parseDobToIso(dob);
    const heightValue = height.trim();
    const weightValue = weight.trim();

    setErrorMessage("");
    setSuccessMessage("");

    if (!nameValue || !emailValue || !passwordValue || !confirmPasswordValue) {
      setErrorMessage("Vui lòng nhập đầy đủ họ tên, email và mật khẩu.");
      return;
    }

    if (!emailValue.includes("@")) {
      setErrorMessage("Email không hợp lệ.");
      return;
    }

    if (passwordValue.length < 6) {
      setErrorMessage("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    if (passwordValue !== confirmPasswordValue) {
      setErrorMessage("Mật khẩu nhập lại không khớp.");
      return;
    }

    if (!dobIso) {
      setErrorMessage("Ngày sinh không hợp lệ. Dùng định dạng dd/mm/yyyy.");
      return;
    }

    if (!gender) {
      setErrorMessage("Vui lòng chọn giới tính.");
      return;
    }

    if (!isPositiveNumber(heightValue) || !isPositiveNumber(weightValue)) {
      setErrorMessage("Chiều cao và cân nặng phải là số dương.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { response: registerResponse, data: registerJson, baseUrl: resolvedBaseUrl } =
        await requestJsonWithFallback("/api/user/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: emailValue,
            password: passwordValue,
            username: nameValue,
            dob: dobIso,
            gender,
          }),
        });
      if (!registerResponse.ok) {
        setErrorMessage(
          toVietnameseMessage(registerJson.message, "Tạo tài khoản thất bại."),
        );
        return;
      }

      if (heightValue || weightValue) {
        const loginResponse = await fetch(`${resolvedBaseUrl}/api/user/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: emailValue,
            password: passwordValue,
          }),
        });

        const loginJson = await loginResponse.json().catch(() => ({}));
        if (loginResponse.ok && loginJson.token) {
          const updatePayload = {};
          if (heightValue) {
            updatePayload.height = Number(heightValue);
          }
          if (weightValue) {
            updatePayload.weight = Number(weightValue);
          }

          if (Object.keys(updatePayload).length > 0) {
            await fetch(`${resolvedBaseUrl}/api/user/profile`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${loginJson.token}`,
              },
              body: JSON.stringify(updatePayload),
            });
          }
        }
      }

      const successText = toVietnameseMessage(
        registerJson.message,
        "Tạo tài khoản thành công.",
      );
      setSuccessMessage(successText);
      Alert.alert("Thành công", successText);
    } catch (_error) {
      setErrorMessage(
        `Không thể kết nối backend. Kiểm tra BE cổng 3000/CORS. URL đã thử: ${formatApiBaseCandidates()}`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.screen}
      >
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.topBar}>
            <Pressable style={styles.backButton} onPress={() => onBackToWelcome?.()}>
              <Ionicons name="chevron-back" size={26} color="#0c2547" />
            </Pressable>
            <View style={styles.topSpacer} />
          </View>

          <View style={styles.topWrap}>
            <View style={styles.logoCard}>
              <MaterialCommunityIcons name="medical-bag" size={28} color="#1ea27b" />
            </View>
            <Text style={styles.title}>Tạo tài khoản</Text>
            <Text style={styles.subtitle}>
              Hoàn thiện thông tin để bắt đầu quản lý sức khỏe
            </Text>
          </View>

          <View style={styles.formWrap}>
            <Text style={styles.inputLabel}>Họ và tên</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={18} color="#a5afbe" style={styles.leftIcon} />
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Nguyễn Văn A"
                placeholderTextColor="#b6bfcd"
                style={styles.input}
              />
            </View>

            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={18} color="#a5afbe" style={styles.leftIcon} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="example@gmail.com"
                placeholderTextColor="#b6bfcd"
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
              />
            </View>

            <Text style={styles.inputLabel}>Mật khẩu</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color="#a5afbe"
                style={styles.leftIcon}
              />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#b6bfcd"
                autoCapitalize="none"
                secureTextEntry={!isPasswordVisible}
                style={styles.input}
              />
              <Pressable
                onPress={() => setIsPasswordVisible((prev) => !prev)}
                hitSlop={8}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={isPasswordVisible ? "eye-outline" : "eye-off-outline"}
                  size={18}
                  color="#a5afbe"
                />
              </Pressable>
            </View>

            <Text style={styles.inputLabel}>Nhập lại mật khẩu</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="checkmark-circle-outline"
                size={18}
                color="#a5afbe"
                style={styles.leftIcon}
              />
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="••••••••"
                placeholderTextColor="#b6bfcd"
                autoCapitalize="none"
                secureTextEntry={!isConfirmPasswordVisible}
                style={styles.input}
              />
              <Pressable
                onPress={() => setIsConfirmPasswordVisible((prev) => !prev)}
                hitSlop={8}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={isConfirmPasswordVisible ? "eye-outline" : "eye-off-outline"}
                  size={18}
                  color="#a5afbe"
                />
              </Pressable>
            </View>

            <Text style={styles.sectionLabel}>THÔNG TIN SỨC KHỎE</Text>

            <View style={styles.rowTwo}>
              <View style={styles.col}>
                <Text style={styles.inputLabel}>Ngày sinh</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="calendar-outline" size={18} color="#a5afbe" style={styles.leftIcon} />
                  <TextInput
                    value={dob}
                    onChangeText={setDob}
                    placeholder="dd/mm/yyyy"
                    placeholderTextColor="#b6bfcd"
                    style={styles.input}
                  />
                </View>
              </View>

              <View style={styles.col}>
                <Text style={styles.inputLabel}>Giới tính</Text>
                <View style={styles.genderRow}>
                  {GENDER_OPTIONS.map((option) => {
                    const active = option === gender;
                    return (
                      <Pressable
                        key={option}
                        onPress={() => setGender(option)}
                        style={[styles.genderChip, active && styles.genderChipActive]}
                      >
                        <Text style={[styles.genderText, active && styles.genderTextActive]}>
                          {option}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>

            <View style={styles.rowTwo}>
              <View style={styles.col}>
                <Text style={styles.inputLabel}>Chiều cao (cm)</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="resize-outline" size={18} color="#a5afbe" style={styles.leftIcon} />
                  <TextInput
                    value={height}
                    onChangeText={setHeight}
                    placeholder="170"
                    placeholderTextColor="#b6bfcd"
                    keyboardType="numeric"
                    style={styles.input}
                  />
                </View>
              </View>
              <View style={styles.col}>
                <Text style={styles.inputLabel}>Cân nặng (kg)</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="barbell-outline" size={18} color="#a5afbe" style={styles.leftIcon} />
                  <TextInput
                    value={weight}
                    onChangeText={setWeight}
                    placeholder="65"
                    placeholderTextColor="#b6bfcd"
                    keyboardType="numeric"
                    style={styles.input}
                  />
                </View>
              </View>
            </View>

            {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
            {!!successMessage && <Text style={styles.successText}>{successMessage}</Text>}

            <Pressable
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleRegister}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.submitText}>Tạo tài khoản</Text>
              )}
            </Pressable>

            <View style={styles.loginRow}>
              <Text style={styles.loginHint}>Đã có tài khoản? </Text>
              <Pressable onPress={() => onSwitchToLogin?.()}>
                <Text style={styles.loginLink}>Đăng nhập ngay</Text>
              </Pressable>
            </View>

            <Text style={styles.policyText}>
              Bằng việc đăng ký, bạn đồng ý với Điều khoản dịch vụ và Chính sách bảo mật của
              chúng tôi.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f4f5f7",
  },
  screen: {
    flex: 1,
  },
  topBar: {
    height: 54,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  topSpacer: {
    width: 36,
  },
  topWrap: {
    alignItems: "center",
    paddingTop: 6,
    paddingHorizontal: 20,
  },
  logoCard: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: "#eaf5f0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "700",
    color: "#202c44",
  },
  subtitle: {
    marginTop: 5,
    textAlign: "center",
    fontSize: 14,
    color: "#7b879b",
  },
  formWrap: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 30,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3c4b66",
    marginBottom: 8,
  },
  inputContainer: {
    height: 52,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#e4e8ef",
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  leftIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#24334f",
  },
  eyeButton: {
    padding: 2,
  },
  sectionLabel: {
    marginTop: 6,
    marginBottom: 10,
    fontSize: 12,
    fontWeight: "700",
    color: "#9ea8b8",
    letterSpacing: 0.7,
  },
  rowTwo: {
    flexDirection: "row",
    gap: 10,
  },
  col: {
    flex: 1,
  },
  genderRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 14,
  },
  genderChip: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e4e8ef",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  genderChipActive: {
    borderColor: "#2a7f61",
    backgroundColor: "#e7f4ee",
  },
  genderText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#576580",
  },
  genderTextActive: {
    color: "#2a7f61",
  },
  errorText: {
    marginBottom: 10,
    color: "#d9424f",
    fontSize: 13,
  },
  successText: {
    marginBottom: 10,
    color: "#1f8b67",
    fontSize: 13,
  },
  submitButton: {
    marginTop: 4,
    height: 54,
    borderRadius: 14,
    backgroundColor: "#2f7f5d",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2f7f5d",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  submitButtonDisabled: {
    opacity: 0.75,
  },
  submitText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
  loginRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },
  loginHint: {
    color: "#8d98ab",
    fontSize: 15,
  },
  loginLink: {
    color: "#2f7f5d",
    fontSize: 15,
    fontWeight: "700",
  },
  policyText: {
    marginTop: 18,
    textAlign: "center",
    color: "#a0a9b9",
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 12,
  },
});
