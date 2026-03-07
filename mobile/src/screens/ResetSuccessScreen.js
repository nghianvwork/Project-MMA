import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function ResetSuccessScreen({ onBackToLogin }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.screen}>
        <View style={styles.heroWrap}>
          <View style={styles.outerCircle}>
            <View style={styles.innerCircle}>
              <View style={styles.checkBadge}>
                <Ionicons name="checkmark" size={52} color="#dff8f3" />
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.title}>Đổi mật khẩu thành công!</Text>
        <Text style={styles.subtitle}>
          Bây giờ bạn có thể đăng nhập bằng mật khẩu mới của mình để tiếp tục
          theo dõi sức khỏe.
        </Text>

        <Pressable style={styles.loginButton} onPress={() => onBackToLogin?.()}>
          <Text style={styles.loginText}>Quay lại Đăng nhập</Text>
        </Pressable>
      </View>
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
    paddingHorizontal: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  heroWrap: {
    marginTop: -40,
    marginBottom: 28,
  },
  outerCircle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "#dcf5ef",
    alignItems: "center",
    justifyContent: "center",
  },
  innerCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#eff9f6",
    alignItems: "center",
    justifyContent: "center",
  },
  checkBadge: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: "#1dd8c7",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1dd8c7",
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  title: {
    textAlign: "center",
    fontSize: 40,
    lineHeight: 46,
    fontWeight: "800",
    color: "#0e2545",
  },
  subtitle: {
    marginTop: 10,
    textAlign: "center",
    color: "#5b7390",
    fontSize: 17,
    lineHeight: 25,
  },
  loginButton: {
    marginTop: 46,
    width: "100%",
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
  loginText: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
    color: "#0c2441",
  },
});
