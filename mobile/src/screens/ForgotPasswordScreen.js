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

const VN_FORGOT_MESSAGE_MAP = {
  "Email is required": "Vui lòng nhập email.",
  "Email not found": "Email chưa được đăng ký.",
  "OTP sent to email": "Đã gửi mã xác thực 6 số vào email của bạn.",
  "SMTP is not configured": "Máy chủ email chưa được cấu hình.",
  "SMTP authentication failed":
    "Xác thực SMTP thất bại. Kiểm tra SMTP_USER hoặc SMTP_PASS trong BE/.env.",
  "SMTP connection failed":
    "Không kết nối được SMTP. Kiểm tra SMTP_HOST, SMTP_PORT và mạng.",
  "Server error": "Lỗi máy chủ.",
};

const toVietnameseMessage = (message, fallback) => {
  if (!message) {
    return fallback;
  }
  return VN_FORGOT_MESSAGE_MAP[message] || message;
};

export default function ForgotPasswordScreen({ onBackToLogin, onOtpSent }) {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const circleDots = useMemo(
    () => [
      { key: "dot-top", top: 10, right: 66, size: 18 },
      { key: "dot-left", top: 124, left: 28, size: 12 },
    ],
    [],
  );

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    const emailValue = emailOrPhone.trim().toLowerCase();
    setErrorMessage("");
    setSuccessMessage("");

    if (!emailValue) {
      setErrorMessage("Vui lòng nhập email.");
      return;
    }

    if (!emailValue.includes("@")) {
      setErrorMessage("Backend hiện chỉ hỗ trợ quên mật khẩu bằng email.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { response, data } = await requestJsonWithFallback("/api/user/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailValue }),
      });

      if (!response.ok) {
        setErrorMessage(
          toVietnameseMessage(
            data.message,
            "Không thể gửi mã xác thực. Vui lòng thử lại.",
          ),
        );
        return;
      }

      const successText = toVietnameseMessage(
        data.message,
        "Đã gửi mã xác thực 6 số vào email của bạn.",
      );
      setSuccessMessage(successText);

      if (typeof onOtpSent === "function") {
        onOtpSent(emailValue);
      }
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
        <ScrollView bounces={false} keyboardShouldPersistTaps="handled">
          <View style={styles.topBar}>
            <Pressable
              style={styles.backButton}
              onPress={() => onBackToLogin?.()}
              hitSlop={8}
            >
              <Ionicons name="chevron-back" size={24} color="#173253" />
            </Pressable>
            <Text style={styles.topTitle}>Quên mật khẩu</Text>
            <View style={styles.topSpacer} />
          </View>

          <View style={styles.heroWrap}>
            <View style={styles.heroCircleOuter}>
              <View style={styles.heroCircleInner}>
                <View style={styles.lockBadge}>
                  <MaterialCommunityIcons
                    name="shield-lock"
                    size={36}
                    color="#1dd8c7"
                  />
                </View>
              </View>
              {circleDots.map((dot) => (
                <View
                  key={dot.key}
                  style={[
                    styles.heroDot,
                    { top: dot.top, right: dot.right, left: dot.left, width: dot.size, height: dot.size },
                  ]}
                />
              ))}
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.title}>Khôi phục truy cập</Text>
            <Text style={styles.subtitle}>
              Đừng lo, chuyện này vẫn xảy ra. Nhập email đã đăng ký để nhận mã
              xác thực 6 số.
            </Text>

            <Text style={styles.inputLabel}>Email hoặc số điện thoại</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="mail-outline"
                size={20}
                color="#9aabc0"
                style={styles.leftIcon}
              />
              <TextInput
                value={emailOrPhone}
                onChangeText={setEmailOrPhone}
                placeholder="vd: tenban@email.com"
                placeholderTextColor="#a9b8ca"
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
              />
            </View>

            {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
            {!!successMessage && <Text style={styles.successText}>{successMessage}</Text>}

            <Pressable
              style={[styles.submitButton, isSubmitting && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#08343b" />
              ) : (
                <Text style={styles.submitText}>Gửi mã xác thực</Text>
              )}
            </Pressable>

            <View style={styles.dividerWrap}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>HOẶC</Text>
              <View style={styles.dividerLine} />
            </View>

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
    marginTop: 22,
  },
  heroCircleOuter: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#d9f4ef",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  heroCircleInner: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  lockBadge: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: "#dff8f3",
    alignItems: "center",
    justifyContent: "center",
  },
  heroDot: {
    borderRadius: 999,
    backgroundColor: "#48dfd0",
    position: "absolute",
  },
  formSection: {
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 34,
  },
  title: {
    textAlign: "center",
    fontSize: 44,
    lineHeight: 50,
    fontWeight: "800",
    color: "#0b1f3e",
  },
  subtitle: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 17,
    lineHeight: 25,
    color: "#556f8d",
    paddingHorizontal: 4,
    marginBottom: 24,
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
    shadowColor: "#1dd8c7",
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 7,
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
  dividerWrap: {
    marginTop: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#dee5ee",
  },
  dividerText: {
    color: "#a1adbe",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  backLoginButton: {
    marginTop: 24,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  backLoginText: {
    color: "#4a607d",
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "600",
  },
});
