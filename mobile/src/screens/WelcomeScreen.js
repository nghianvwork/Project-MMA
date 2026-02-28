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
                <Ionicons name="phone-portrait-outline" size={66} color="#d5e4eb" />
                <View style={styles.heroMedicalBadge}>
                  <MaterialCommunityIcons
                    name="medical-bag"
                    size={14}
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
                  <Ionicons name={item.icon} size={18} color="#0a7469" />
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
    alignSelf: "center",
    backgroundColor: "#f4f6f8",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 22,
  },
  heroCard: {
    height: 330,
    borderRadius: 14,
    backgroundColor: "#2b8f91",
    overflow: "hidden",
    paddingHorizontal: 14,
    paddingTop: 16,
    justifyContent: "space-between",
  },
  heroCircleTop: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "rgba(123, 242, 230, 0.18)",
    top: -95,
    right: -95,
  },
  heroCircleBottom: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(9, 54, 57, 0.36)",
    bottom: -95,
    left: -70,
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#18dcc5",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#053e3e",
    letterSpacing: 0.3,
  },
  heroTitle: {
    marginTop: 10,
    fontSize: 27,
    lineHeight: 34,
    fontWeight: "800",
    color: "#f8ffff",
    maxWidth: 230,
  },
  heroVisualWrap: {
    height: 125,
    marginBottom: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  heroPhone: {
    width: 118,
    height: 118,
    borderRadius: 59,
    backgroundColor: "rgba(17, 87, 90, 0.55)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(211, 232, 241, 0.32)",
  },
  heroMedicalBadge: {
    position: "absolute",
    top: 39,
    right: 33,
    width: 26,
    height: 26,
    borderRadius: 13,
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
    right: 36,
    bottom: 0,
    fontSize: 28,
  },
  bodyText: {
    marginTop: 18,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 22,
    color: "#2a4766",
    paddingHorizontal: 10,
  },
  featureList: {
    marginTop: 12,
    gap: 9,
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eefbfa",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#bce9e4",
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  featureIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#18ddc5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  featureTextWrap: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
    color: "#10233f",
  },
  featureDescription: {
    marginTop: 1,
    fontSize: 11,
    lineHeight: 15,
    color: "#5f7086",
  },
  primaryButton: {
    marginTop: 14,
    height: 50,
    borderRadius: 12,
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
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
    color: "#07363d",
  },
  secondaryButton: {
    marginTop: 10,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dde4ec",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
    color: "#1d2f4b",
  },
});
