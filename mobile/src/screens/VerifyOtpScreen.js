import { StatusBar } from "expo-status-bar";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
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

const VN_VERIFY_OTP_MESSAGE_MAP = {
  "Missing email or otp": "Thiếu email hoặc mã xác thực.",
  "Invalid or expired OTP": "Mã xác thực không đúng hoặc đã hết hạn.",
  "OTP verified": "Xác thực mã thành công.",
  "Email not found": "Email chưa được đăng ký.",
  "OTP sent to email": "Đã gửi lại mã xác thực vào email.",
  "Server error": "Lỗi máy chủ.",
};

const toVietnameseMessage = (message, fallback) => {
  if (!message) {
    return fallback;
  }
  return VN_VERIFY_OTP_MESSAGE_MAP[message] || message;
};

export default function VerifyOtpScreen({
  email,
  onBack,
  onVerified,
  onBackToLogin,
}) {
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleVerify = async () => {
    if (isSubmitting) {
      return;
    }

    const otpValue = otp.trim();
    setErrorMessage("");
    setSuccessMessage("");

    if (!email) {
      setErrorMessage("Không có email để xác thực. Vui lòng gửi mã lại.");
      return;
    }

    if (!/^\d{6}$/.test(otpValue)) {
      setErrorMessage("Vui lòng nhập đúng mã xác thực 6 số.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { response, data } = await requestJsonWithFallback(
        "/api/user/verify-reset-otp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp: otpValue }),
        },
      );

      if (!response.ok) {
        setErrorMessage(
          toVietnameseMessage(data.message, "Xác thực mã thất bại. Vui lòng thử lại."),
        );
        return;
      }

      const successText = toVietnameseMessage(data.message, "Xác thực mã thành công.");
      setSuccessMessage(successText);

      if (typeof onVerified === "function") {
        onVerified({
          email,
          resetToken: data.reset_token || "",
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

  const handleResend = async () => {
    if (isResending) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    if (!email) {
      setErrorMessage("Không có email để gửi lại mã.");
      return;
    }

    setIsResending(true);
    try {
      const { response, data } = await requestJsonWithFallback("/api/user/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        setErrorMessage(
          toVietnameseMessage(
            data.message,
            "Không thể gửi lại mã xác thực. Vui lòng thử lại.",
          ),
        );
        return;
      }

      setSuccessMessage(
        toVietnameseMessage(data.message, "Đã gửi lại mã xác thực vào email."),
      );
    } catch (_error) {
      setErrorMessage(
        `Không thể kết nối backend. URL đã thử: ${formatApiBaseCandidates()}`,
      );
    } finally {
      setIsResending(false);
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
            <Text style={styles.topTitle}>Nhập mã xác thực</Text>
            <View style={styles.topSpacer} />
          </View>

          <View style={styles.heroWrap}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="email-check-outline" size={54} color="#1dd8c7" />
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.title}>Xác thực email</Text>
            <Text style={styles.subtitle}>
              Mã 6 số đã được gửi đến:{" "}
              <Text style={styles.emailText}>{email || "chưa có email"}</Text>
            </Text>

            <Text style={styles.inputLabel}>Mã xác thực</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="key-outline"
                size={20}
                color="#9aabc0"
                style={styles.leftIcon}
              />
              <TextInput
                value={otp}
                onChangeText={(value) => setOtp(value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Nhập 6 số"
                placeholderTextColor="#a9b8ca"
                keyboardType="number-pad"
                style={styles.input}
                maxLength={6}
              />
            </View>

            {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
            {!!successMessage && <Text style={styles.successText}>{successMessage}</Text>}

            <Pressable
              style={[styles.submitButton, isSubmitting && styles.disabledButton]}
              onPress={handleVerify}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#08343b" />
              ) : (
                <Text style={styles.submitText}>Xác nhận mã</Text>
              )}
            </Pressable>

            <Pressable
              style={styles.resendButton}
              onPress={handleResend}
              disabled={isResending}
            >
              {isResending ? (
                <ActivityIndicator color="#4b5f7a" />
              ) : (
                <Text style={styles.resendText}>Gửi lại mã</Text>
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
  heroWrap: {
    alignItems: "center",
    marginTop: 24,
  },
  iconCircle: {
    width: 148,
    height: 148,
    borderRadius: 74,
    backgroundColor: "#d9f4ef",
    alignItems: "center",
    justifyContent: "center",
  },
  formSection: {
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 34,
  },
  title: {
    textAlign: "center",
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800",
    color: "#0b1f3e",
  },
  subtitle: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 16,
    lineHeight: 24,
    color: "#556f8d",
    marginBottom: 24,
  },
  emailText: {
    fontWeight: "700",
    color: "#213b5d",
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
  },
  leftIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: "#132b4c",
    fontSize: 17,
    letterSpacing: 4,
  },
  errorText: {
    marginTop: 10,
    color: "#d93f4c",
    fontSize: 14,
  },
  successText: {
    marginTop: 10,
    color: "#209971",
    fontSize: 14,
  },
  submitButton: {
    marginTop: 20,
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
  resendButton: {
    marginTop: 12,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#dbe4ee",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  resendText: {
    fontSize: 15,
    lineHeight: 20,
    color: "#4c607b",
    fontWeight: "600",
  },
  backLoginButton: {
    marginTop: 24,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backLoginText: {
    color: "#4a607d",
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "600",
  },
});
