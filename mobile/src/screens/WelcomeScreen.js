import { StatusBar } from "expo-status-bar";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const FEATURES = [
  {
    icon: "link-outline",
    title: "Theo dõi thuốc",
    description: "Ghi chép lịch sử uống thuốc mỗi ngày",
  },
  {
    icon: "notifications-outline",
    title: "Nhắc nhở thông minh",
    description: "Thông báo đúng giờ, đúng liều lượng",
  },
  {
    icon: "location-outline",
    title: "Nhà thuốc gần đây",
    description: "Tìm sự trợ giúp y tế nhanh chóng",
  },
];

export default function WelcomeScreen({ onJoinNow, onLogin }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.phoneFrame}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCard}>
            <View style={styles.heroCircleTop} />
            <View style={styles.heroCircleBottom} />

            <View style={styles.badge}>
              <Text style={styles.badgeText}>CHÀO MỪNG BẠN</Text>
            </View>

            <Text style={styles.heroTitle}>Quản lý sức khỏe thật dễ dàng</Text>

            <View style={styles.heroVisualWrap}>
              <View style={styles.heroPhone}>
                <Ionicons name="phone-portrait-outline" size={96} color="#d5e4eb" />
                <View style={styles.heroMedicalBadge}>
                  <MaterialCommunityIcons
                    name="medical-bag"
                    size={20}
                    color="#16d8c3"
                  />
                </View>
              </View>
              <Text style={styles.handEmoji}>✋</Text>
            </View>
          </View>

          <Text style={styles.bodyText}>
            Đừng bao giờ quên liều thuốc của bạn với hệ thống theo dõi thông minh của
            MedTrack.
          </Text>

          <View style={styles.featureList}>
            {FEATURES.map((item) => (
              <View key={item.title} style={styles.featureCard}>
                <View style={styles.featureIconWrap}>
                  <Ionicons name={item.icon} size={22} color="#0a7469" />
                </View>
                <View style={styles.featureTextWrap}>
                  <Text style={styles.featureTitle}>{item.title}</Text>
                  <Text style={styles.featureDescription}>{item.description}</Text>
                </View>
              </View>
            ))}
          </View>

          <Pressable style={styles.primaryButton} onPress={() => onJoinNow?.()}>
            <Text style={styles.primaryButtonText}>Tham gia ngay</Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={() => onLogin?.()}>
            <Text style={styles.secondaryButtonText}>Đăng nhập</Text>
          </Pressable>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f4f6f8",
  },
  phoneFrame: {
    flex: 1,
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    backgroundColor: "#f4f6f8",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 28,
  },
  heroCard: {
    height: 430,
    borderRadius: 16,
    backgroundColor: "#2b8f91",
    overflow: "hidden",
    paddingHorizontal: 22,
    paddingTop: 24,
    justifyContent: "space-between",
  },
  heroCircleTop: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "rgba(123, 242, 230, 0.18)",
    top: -130,
    right: -140,
  },
  heroCircleBottom: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(9, 54, 57, 0.36)",
    bottom: -130,
    left: -90,
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#18dcc5",
  },
  badgeText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#053e3e",
    letterSpacing: 0.5,
  },
  heroTitle: {
    marginTop: 14,
    fontSize: 49,
    lineHeight: 56,
    fontWeight: "800",
    color: "#f8ffff",
    maxWidth: 330,
  },
  heroVisualWrap: {
    height: 180,
    marginBottom: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  heroPhone: {
    width: 170,
    height: 170,
    borderRadius: 90,
    backgroundColor: "rgba(17, 87, 90, 0.55)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(211, 232, 241, 0.32)",
  },
  heroMedicalBadge: {
    position: "absolute",
    top: 58,
    right: 48,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  handEmoji: {
    position: "absolute",
    right: 58,
    bottom: 0,
    fontSize: 42,
  },
  bodyText: {
    marginTop: 26,
    textAlign: "center",
    fontSize: 21,
    lineHeight: 34,
    color: "#2a4766",
    paddingHorizontal: 16,
  },
  featureList: {
    marginTop: 16,
    gap: 12,
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eefbfa",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#bce9e4",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  featureIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: "#18ddc5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  featureTextWrap: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "700",
    color: "#10233f",
  },
  featureDescription: {
    marginTop: 2,
    fontSize: 22,
    lineHeight: 28,
    color: "#5f7086",
  },
  primaryButton: {
    marginTop: 18,
    height: 58,
    borderRadius: 14,
    backgroundColor: "#1dd8c7",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1dd8c7",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  primaryButtonText: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700",
    color: "#07363d",
  },
  secondaryButton: {
    marginTop: 12,
    height: 58,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#dde4ec",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700",
    color: "#1d2f4b",
  },
});
