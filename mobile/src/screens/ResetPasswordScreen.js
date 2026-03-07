import { StatusBar } from "expo-status-bar";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
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
import {
  formatApiBaseCandidates,
  requestJsonWithFallback,
} from "../utils/apiClient";

const VN_RESET_MESSAGE_MAP = {
  "Missing data": "Thiếu dữ liệu đặt lại mật khẩu.",
  "Invalid or expired token": "Phiên đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.",
  "Password too short": "Mật khẩu mới phải có ít nhất 6 ký tự.",
  "Password reset successful": "Đổi mật khẩu thành công.",
  "Server error": "Lỗi máy chủ.",
};

const toVietnameseMessage = (message, fallback) => {
  if (!message) {
    return fallback;
  }
  return VN_RESET_MESSAGE_MAP[message] || message;
};

const calculatePasswordStrength = (passwordValue) => {
  const password = String(passwordValue || "");
  let score = 0;
  if (password.length >= 8) score += 25;
  if (/[A-Z]/.test(password)) score += 20;
  if (/[a-z]/.test(password)) score += 20;
  if (/\d/.test(password)) score += 20;
  if (/[^A-Za-z0-9]/.test(password)) score += 15;
  return Math.min(100, score);
};

const getStrengthLabel = (score) => {
  if (score >= 80) return "Mạnh";
  if (score >= 50) return "Trung bình";
  return "Yếu";
};

export default function ResetPasswordScreen({
  email,
  resetToken,
  onBack,
  onResetSuccess,
  onBackToLogin,
}) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const strengthScore = useMemo(
    () => calculatePasswordStrength(newPassword),
    [newPassword],
  );
  const strengthLabel = useMemo(() => getStrengthLabel(strengthScore), [strengthScore]);

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    const passwordValue = String(newPassword || "").trim();
    const confirmValue = String(confirmPassword || "").trim();

    setErrorMessage("");
    setSuccessMessage("");

    if (!resetToken) {
      setErrorMessage("Phiên đặt lại mật khẩu không tồn tại. Vui lòng xác thực mã lại.");
      return;
    }

    if (!passwordValue || !confirmValue) {
      setErrorMessage("Vui lòng nhập đầy đủ mật khẩu mới và xác nhận.");
      return;
    }

    if (passwordValue.length < 6) {
      setErrorMessage("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }

    if (passwordValue !== confirmValue) {
      setErrorMessage("Mật khẩu xác nhận không khớp.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { response, data } = await requestJsonWithFallback("/api/user/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: resetToken,
          newPassword: passwordValue,
        }),
      });

      if (!response.ok) {
        setErrorMessage(
          toVietnameseMessage(data.message, "Không thể cập nhật mật khẩu. Vui lòng thử lại."),
        );
        return;
      }

      const successText = toVietnameseMessage(data.message, "Đổi mật khẩu thành công.");
      setSuccessMessage(successText);

      if (typeof onResetSuccess === "function") {
        onResetSuccess({
          email,
        });
      }
    } catch (_error) {
      setErrorMessage(
        `Không thể kết nối backend. URL đã thử: ${formatApiBaseCandidates()}`,
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
        <ScrollView bounces={false} keyboardShouldPersistTaps="handled">
          <View style={styles.topBar}>
            <Pressable style={styles.backButton} onPress={() => onBack?.()} hitSlop={8}>
              <Ionicons name="chevron-back" size={24} color="#163052" />
            </Pressable>
            <Text style={styles.topTitle}>Thiết lập mật khẩu mới</Text>
            <View style={styles.topSpacer} />
          </View>

          <View style={styles.formSection}>
            <View style={styles.lockIconWrap}>
              <MaterialCommunityIcons name="lock-reset" size={28} color="#20d7c2" />
            </View>

            <Text style={styles.title}>Tạo mật khẩu an toàn</Text>
            <Text style={styles.subtitle}>
              Vui lòng nhập mật khẩu mới để bảo mật tài khoản. Nên dùng ít nhất
              8 ký tự.
            </Text>

            <Text style={styles.inputLabel}>Mật khẩu mới</Text>
            <View style={styles.inputContainer}>
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Nhập mật khẩu mới"
                placeholderTextColor="#a8b5c7"
                secureTextEntry={!isNewPasswordVisible}
                style={styles.input}
              />
              <Pressable
                onPress={() => setIsNewPasswordVisible((prev) => !prev)}
                hitSlop={8}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={isNewPasswordVisible ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color="#9eabba"
                />
              </Pressable>
            </View>

            <View style={styles.strengthCard}>
              <View style={styles.strengthHead}>
                <Text style={styles.strengthTitle}>Độ mạnh mật khẩu</Text>
                <Text style={styles.strengthValue}>
                  {strengthLabel} ({strengthScore}%)
                </Text>
              </View>
              <View style={styles.strengthTrack}>
                <View style={[styles.strengthFill, { width: `${strengthScore}%` }]} />
              </View>
              <Text style={styles.strengthHint}>
                Mật khẩu nên bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
              </Text>
            </View>

            <Text style={styles.inputLabel}>Xác nhận mật khẩu</Text>
            <View style={styles.inputContainer}>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Nhập lại mật khẩu mới"
                placeholderTextColor="#a8b5c7"
                secureTextEntry={!isConfirmVisible}
                style={styles.input}
              />
              <Pressable
                onPress={() => setIsConfirmVisible((prev) => !prev)}
                hitSlop={8}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={isConfirmVisible ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color="#9eabba"
                />
              </Pressable>
            </View>

            {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
            {!!successMessage && <Text style={styles.successText}>{successMessage}</Text>}

            <Pressable
              style={[styles.submitButton, isSubmitting && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#0c2441" />
              ) : (
                <Text style={styles.submitText}>Cập nhật mật khẩu</Text>
              )}
            </Pressable>

            <Pressable style={styles.backLoginButton} onPress={() => onBackToLogin?.()}>
              <Ionicons name="arrow-back" size={18} color="#425a78" />
              <Text style={styles.backLoginText}>Quay lại đăng nhập</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  screen: {
    flex: 1,
  },
  topBar: {
    height: 56,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f3f4f6",
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700",
    color: "#0f2544",
  },
  topSpacer: {
    width: 36,
  },
  formSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  lockIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "#d8f5ef",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 42,
    lineHeight: 48,
    fontWeight: "800",
    color: "#102748",
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 18,
    color: "#5a7390",
    fontSize: 16,
    lineHeight: 23,
  },
  inputLabel: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
    color: "#142e50",
    marginBottom: 8,
  },
  inputContainer: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dde5ee",
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  input: {
    flex: 1,
    color: "#132b4c",
    fontSize: 17,
  },
  eyeButton: {
    padding: 2,
  },
  strengthCard: {
    borderRadius: 14,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e0e8f1",
    padding: 12,
    marginBottom: 14,
  },
  strengthHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  strengthTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2f4562",
  },
  strengthValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#20cfae",
  },
  strengthTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#d8e0ea",
  },
  strengthFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#20d7c2",
  },
  strengthHint: {
    marginTop: 8,
    color: "#7088a2",
    fontSize: 13,
    lineHeight: 19,
  },
  errorText: {
    marginBottom: 10,
    color: "#d93f4c",
    fontSize: 14,
  },
  successText: {
    marginBottom: 10,
    color: "#209971",
    fontSize: 14,
  },
  submitButton: {
    marginTop: 6,
    height: 54,
    borderRadius: 12,
    backgroundColor: "#1dd8c7",
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    opacity: 0.75,
  },
  submitText: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
    color: "#0c2441",
  },
  backLoginButton: {
    marginTop: 18,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backLoginText: {
    color: "#4a607d",
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
  },
});
