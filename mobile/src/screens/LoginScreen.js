import { StatusBar } from "expo-status-bar";
import { FontAwesome, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as AuthSession from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import Constants from "expo-constants";
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

WebBrowser.maybeCompleteAuthSession();

const configuredGoogleClientId =
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  "missing-google-client-id";

const VN_MESSAGE_MAP = {
  "Missing email or password": "Thiếu email hoặc mật khẩu.",
  "Invalid email or password": "Email hoặc mật khẩu không đúng.",
  "Login success": "Đăng nhập thành công.",
  "Missing Google token": "Thiếu Google token.",
  "Missing Google idToken": "Thiếu Google idToken.",
  "Invalid Google token": "Google token không hợp lệ.",
  "Google account has no email": "Tài khoản Google không có email.",
  "Google email is not verified": "Email Google chưa được xác minh.",
  "Google login success": "Đăng nhập Google thành công.",
  "Google login is not configured on server. Missing GOOGLE_CLIENT_ID(S).":
    "Backend chưa cấu hình GOOGLE_CLIENT_ID(S).",
  "Server error": "Lỗi máy chủ.",
};

const hasGoogleClientConfig = Boolean(
  process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID ||
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ||
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
);

const normalizeWebRedirectUri = (value) => {
  if (!value) {
    return "";
  }
  return `${value.replace(/\/+$/, "")}/`;
};

const runtimeWebOrigin =
  typeof window !== "undefined" && window?.location?.origin
    ? window.location.origin
    : "http://localhost:8081";

const expoOwner = Constants?.expoConfig?.owner || "";
const expoSlug = Constants?.expoConfig?.slug || "mobile";
const envProjectNameForProxy = process.env.EXPO_PUBLIC_GOOGLE_PROXY_PROJECT_NAME || "";
const projectNameForProxy =
  envProjectNameForProxy || (expoOwner ? `@${expoOwner}/${expoSlug}` : "");

const isExpoGo = Constants?.appOwnership === "expo";
const shouldUseGoogleProxy =
  Platform.OS !== "web" && (isExpoGo || Boolean(envProjectNameForProxy));

const makeProxyRedirectUri = () => {
  if (projectNameForProxy) {
    return normalizeWebRedirectUri(`https://auth.expo.io/${projectNameForProxy}`);
  }
  const proxyOptions = { useProxy: true };
  return AuthSession.makeRedirectUri(proxyOptions);
};

let googleRedirectUri = normalizeWebRedirectUri(
  process.env.EXPO_PUBLIC_GOOGLE_WEB_REDIRECT_URI || runtimeWebOrigin,
);

if (shouldUseGoogleProxy) {
  googleRedirectUri = makeProxyRedirectUri();
} else if (Platform.OS !== "web") {
  googleRedirectUri = AuthSession.makeRedirectUri({
    native: "mma-mobile:/oauthredirect",
  });
}

if (__DEV__) {
  // Dùng URL này để thêm vào Google Console Authorized redirect URIs.
  console.log("REDIRECT:", googleRedirectUri);
}

const toVietnameseMessage = (message, fallback) => {
  if (!message) {
    return fallback;
  }
  return VN_MESSAGE_MAP[message] || message;
};

export default function LoginScreen({
  onLoginSuccess,
  onForgotPassword,
  onBackToRegister,
}) {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [googleRequest, _googleResponse, googlePromptAsync] =
    Google.useIdTokenAuthRequest({
      expoClientId:
        process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID ||
        process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
        configuredGoogleClientId,
      clientId: configuredGoogleClientId,
      androidClientId:
        process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || configuredGoogleClientId,
      iosClientId:
        process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || configuredGoogleClientId,
      webClientId:
        process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || configuredGoogleClientId,
      redirectUri: googleRedirectUri,
      useProxy: shouldUseGoogleProxy,
    });

  const getExactRequestRedirectUri = () => {
    if (!googleRequest?.url) {
      return googleRedirectUri;
    }

    try {
      const parsedUrl = new URL(googleRequest.url);
      return parsedUrl.searchParams.get("redirect_uri") || googleRedirectUri;
    } catch (_parseError) {
      return googleRedirectUri;
    }
  };

  const handleLogin = async () => {
    if (isSubmitting) {
      return;
    }

    const emailValue = emailOrPhone.trim();
    const passwordValue = password.trim();

    setErrorMessage("");
    setSuccessMessage("");

    if (!emailValue || !passwordValue) {
      setErrorMessage("Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }

    if (!emailValue.includes("@")) {
      setErrorMessage("Backend hiện chỉ hỗ trợ đăng nhập bằng email.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { response, data } = await requestJsonWithFallback("/api/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailValue,
          password: passwordValue,
        }),
      });

      if (!response.ok) {
        setErrorMessage(
          toVietnameseMessage(data.message, "Đăng nhập thất bại. Vui lòng thử lại."),
        );
        return;
      }

      const successText = toVietnameseMessage(data.message, "Đăng nhập thành công.");
      setSuccessMessage(successText);

      if (typeof onLoginSuccess === "function") {
        onLoginSuccess({
          token: data.token || "",
          user: data.user || null,
          email: emailValue,
        });
        return;
      }

      Alert.alert("Đăng nhập thành công", "Đã kết nối API backend.");
    } catch (_error) {
      setErrorMessage(
        `Không thể kết nối backend. Kiểm tra BE cổng 3000/CORS. URL đã thử: ${formatApiBaseCandidates()}`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (isSubmitting || isGoogleSubmitting) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    if (!hasGoogleClientConfig) {
      setErrorMessage(
        "Thiếu Google client ID. Hãy cấu hình EXPO_PUBLIC_GOOGLE_* trong mobile env.",
      );
      return;
    }

    if (!googleRequest) {
      setErrorMessage("Đăng nhập Google chưa sẵn sàng. Vui lòng thử lại.");
      return;
    }

    setIsGoogleSubmitting(true);

    try {
      const promptOptions = shouldUseGoogleProxy
        ? projectNameForProxy
          ? { useProxy: true, projectNameForProxy }
          : { useProxy: true }
        : {};

      const result = await googlePromptAsync(promptOptions);

      if (result.type !== "success") {
        if (result.type === "error") {
          const oauthErrorCode = result.params?.error || result.errorCode;
          if (oauthErrorCode === "redirect_uri_mismatch") {
            const exactRedirectUri = getExactRequestRedirectUri();
            setErrorMessage(
              `Redirect URI Google không khớp. Thêm URI chính xác này vào Google Console: ${exactRedirectUri}`,
            );
            return;
          }
        }

        if (result.type !== "dismiss" && result.type !== "cancel") {
          setErrorMessage("Đăng nhập Google thất bại. Vui lòng thử lại.");
        }
        return;
      }

      const idToken =
        result.params?.id_token || result.authentication?.idToken || "";
      const accessToken =
        result.params?.access_token || result.authentication?.accessToken || "";

      if (!idToken && !accessToken) {
        setErrorMessage("Không lấy được Google token từ phản hồi Google.");
        return;
      }

      const { response, data } = await requestJsonWithFallback("/api/user/google-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, accessToken }),
      });
      if (!response.ok) {
        setErrorMessage(
          toVietnameseMessage(data.message, "Đăng nhập Google thất bại."),
        );
        return;
      }

      const successText = toVietnameseMessage(
        data.message,
        "Đăng nhập Google thành công.",
      );
      setSuccessMessage(successText);

      if (typeof onLoginSuccess === "function") {
        onLoginSuccess({
          token: data.token || "",
          user: data.user || null,
          email: data.user?.email || "",
        });
        return;
      }

      Alert.alert("Đăng nhập thành công", "Đã kết nối tài khoản Google.");
    } catch (_error) {
      setErrorMessage(
        `Lỗi đăng nhập Google. Kiểm tra API URL và Google client IDs. URL đã thử: ${formatApiBaseCandidates()}`,
      );
    } finally {
      setIsGoogleSubmitting(false);
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
            <Pressable style={styles.backButton} onPress={() => onBackToRegister?.()}>
              <Ionicons name="chevron-back" size={26} color="#0c2547" />
            </Pressable>
            <Text style={styles.topTitle}>Đăng nhập</Text>
            <View style={styles.topSpacer} />
          </View>

          <View style={styles.heroSection}>
            <View style={styles.heroAccentBlue} />
            <View style={styles.heroAccentMint} />
            <View style={styles.logoCard}>
              <MaterialCommunityIcons
                name="medical-bag"
                size={50}
                color="#1dd8c7"
              />
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.welcomeTitle}>Chào mừng trở lại</Text>
            <Text style={styles.subtitle}>
              Quản lý thuốc, tồn kho và báo cáo sức khỏe một cách dễ dàng.
            </Text>

            <Text style={styles.inputLabel}>Email hoặc số điện thoại</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="person-outline"
                size={20}
                color="#9aa8ba"
                style={styles.leftIcon}
              />
              <TextInput
                value={emailOrPhone}
                onChangeText={setEmailOrPhone}
                placeholder="Nhập email hoặc số điện thoại"
                placeholderTextColor="#a8b6c8"
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
              />
            </View>

            <Text style={styles.inputLabel}>Mật khẩu</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#9aa8ba"
                style={styles.leftIcon}
              />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Nhập mật khẩu"
                placeholderTextColor="#a8b6c8"
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
                  size={20}
                  color="#9aa8ba"
                />
              </Pressable>
            </View>

            <Pressable
              onPress={() => onForgotPassword?.()}
              style={styles.forgotWrap}
            >
              <Text style={styles.forgotText}>Quên mật khẩu?</Text>
            </Pressable>

            {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
            {!!successMessage && (
              <Text style={styles.successText}>{successMessage}</Text>
            )}

            <Pressable
              style={[styles.signInButton, isSubmitting && styles.disabledButton]}
              onPress={handleLogin}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#0c2547" />
              ) : (
                <Text style={styles.signInText}>Đăng nhập</Text>
              )}
            </Pressable>

            <Pressable
              style={[styles.googleButton, isGoogleSubmitting && styles.disabledButton]}
              onPress={handleGoogleLogin}
              disabled={isSubmitting || isGoogleSubmitting || !googleRequest}
            >
              {isGoogleSubmitting ? (
                <ActivityIndicator color="#132b4c" />
              ) : (
                <>
                  <FontAwesome name="google" size={20} color="#ea4335" />
                  <Text style={styles.googleText}>Đăng nhập với Google</Text>
                </>
              )}
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
    backgroundColor: "#f2f3f5",
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
    backgroundColor: "#f2f3f5",
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0b1f3b",
    lineHeight: 28,
  },
  topSpacer: {
    width: 36,
  },
  heroSection: {
    height: 220,
    backgroundColor: "#96ddd7",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  heroAccentBlue: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    right: -120,
    top: -100,
    backgroundColor: "#9ac5f5",
    opacity: 0.7,
  },
  heroAccentMint: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    left: -90,
    bottom: -130,
    backgroundColor: "#84d8cf",
    opacity: 0.9,
  },
  logoCard: {
    width: 104,
    height: 104,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.13,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  formSection: {
    paddingTop: 26,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  welcomeTitle: {
    textAlign: "center",
    fontSize: 24,
    fontWeight: "700",
    color: "#0c2547",
    lineHeight: 30,
  },
  subtitle: {
    textAlign: "center",
    marginTop: 6,
    marginBottom: 22,
    fontSize: 17,
    lineHeight: 24,
    color: "#45607f",
    paddingHorizontal: 12,
  },
  inputLabel: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
    color: "#132b4c",
    marginBottom: 8,
  },
  inputContainer: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dce4ec",
    backgroundColor: "#f7f9fc",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginBottom: 18,
  },
  leftIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: "#132b4c",
    fontSize: 18,
  },
  eyeButton: {
    padding: 2,
  },
  forgotWrap: {
    alignSelf: "flex-end",
    marginTop: -8,
    marginBottom: 18,
  },
  forgotText: {
    color: "#1dd8c7",
    fontSize: 15,
    fontWeight: "700",
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
  signInButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: "#1dd8c7",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1dd8c7",
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 7 },
    elevation: 8,
    marginBottom: 20,
  },
  disabledButton: {
    opacity: 0.75,
  },
  signInText: {
    color: "#0c1f3d",
    fontWeight: "700",
    fontSize: 18,
    lineHeight: 24,
  },
  googleButton: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dce4ec",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  googleText: {
    fontSize: 16,
    lineHeight: 22,
    color: "#132b4c",
    fontWeight: "600",
  },
});
