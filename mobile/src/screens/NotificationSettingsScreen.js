import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { getNotificationSettings, updateNotificationSettings } from "../api/notificationApi";
import {
  getScheduledMedicationReminderCount,
  scheduleDebugMedicationNotification,
  syncMedicationReminders,
} from "../services/medicationReminderService";

const DEFAULT_SETTINGS = {
  remind_medicine: 1,
  sound: 1,
  vibrate: 1,
  low_stock_alert: 1,
  family_alert: 1,
  system_alert: 0,
  quiet_hours_enabled: 0,
  quiet_start: "22:00:00",
  quiet_end: "06:00:00",
};

const normalizeSettings = (data) => ({
  remind_medicine: Number(data?.remind_medicine ?? DEFAULT_SETTINGS.remind_medicine),
  sound: Number(data?.sound ?? DEFAULT_SETTINGS.sound),
  vibrate: Number(data?.vibrate ?? DEFAULT_SETTINGS.vibrate),
  low_stock_alert: Number(data?.low_stock_alert ?? DEFAULT_SETTINGS.low_stock_alert),
  family_alert: Number(data?.family_alert ?? DEFAULT_SETTINGS.family_alert),
  system_alert: Number(data?.system_alert ?? DEFAULT_SETTINGS.system_alert),
  quiet_hours_enabled: Number(data?.quiet_hours_enabled ?? DEFAULT_SETTINGS.quiet_hours_enabled),
  quiet_start: String(data?.quiet_start || DEFAULT_SETTINGS.quiet_start),
  quiet_end: String(data?.quiet_end || DEFAULT_SETTINGS.quiet_end),
});

const formatTime = (value) => String(value || "").slice(0, 5);

const RESYNC_FIELDS = new Set([
  "remind_medicine",
  "sound",
  "vibrate",
  "quiet_hours_enabled",
  "quiet_start",
  "quiet_end",
]);

const SETTING_GROUPS = [
  {
    key: "main",
    items: [
      {
        field: "remind_medicine",
        iconName: "notifications-outline",
        iconLib: "ionicons",
        iconColor: "#4ca879",
        iconColorActive: "#1e9e5f",
        iconBg: "#eaf7ef",
        iconBgActive: "#dff5e8",
        title: "Nhắc nhở uống thuốc",
        subtitle: "Nhắc bạn đúng giờ theo lịch đã tạo",
      },
      {
        field: "sound",
        iconName: "volume-medium-outline",
        iconLib: "ionicons",
        iconColor: "#6e7f98",
        iconColorActive: "#1e9e5f",
        iconBg: "#eef2f7",
        iconBgActive: "#dff5e8",
        title: "Âm báo",
        subtitle: "Phát chuông khi đến giờ uống thuốc",
      },
      {
        field: "vibrate",
        iconName: "vibrate",
        iconLib: "material",
        iconColor: "#6e7f98",
        iconColorActive: "#1e9e5f",
        iconBg: "#eef2f7",
        iconBgActive: "#dff5e8",
        title: "Độ rung",
        subtitle: "Rung kèm thông báo để dễ chú ý hơn",
      },
    ],
  },
  {
    key: "other",
    title: "LOẠI THÔNG BÁO KHÁC",
    items: [
      {
        field: "low_stock_alert",
        iconName: "medkit-outline",
        iconLib: "ionicons",
        iconColor: "#d08a48",
        iconColorActive: "#1e9e5f",
        iconBg: "#fff3e7",
        iconBgActive: "#dff5e8",
        title: "Cảnh báo sắp hết thuốc",
        subtitle: "Báo khi số lượng thuốc xuống thấp",
      },
      {
        field: "family_alert",
        iconName: "people-outline",
        iconLib: "ionicons",
        iconColor: "#6f80de",
        iconColorActive: "#1e9e5f",
        iconBg: "#eef0ff",
        iconBgActive: "#dff5e8",
        title: "Thông báo tới người thân",
        subtitle: "Nhắn báo động khi người thân quên thuốc",
      },
      {
        field: "system_alert",
        iconName: "information-circle-outline",
        iconLib: "ionicons",
        iconColor: "#a16dd8",
        iconColorActive: "#1e9e5f",
        iconBg: "#f3ebff",
        iconBgActive: "#dff5e8",
        title: "Thông báo hệ thống",
        subtitle: "Nhận thông tin cập nhật và nhắc nhở chung",
      },
      {
        field: "quiet_hours_enabled",
        iconName: "moon-outline",
        iconLib: "ionicons",
        iconColor: "#7f8798",
        iconColorActive: "#1e9e5f",
        iconBg: "#eff1f5",
        iconBgActive: "#dff5e8",
        title: "Giờ yên lặng",
        subtitleFromSettings: true,
      },
    ],
  },
];

export default function NotificationSettingsScreen({ navigation }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [savingField, setSavingField] = useState("");
  const [errorText, setErrorText] = useState("");
  const [debugBusy, setDebugBusy] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadSettings = async () => {
      setLoading(true);
      setErrorText("");

      try {
        const result = await getNotificationSettings();
        if (!mounted) {
          return;
        }
        setSettings(normalizeSettings(result.data));
      } catch (error) {
        if (!mounted) {
          return;
        }
        setErrorText(error?.message || "Không tải được cài đặt thông báo từ backend.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadSettings();

    return () => {
      mounted = false;
    };
  }, []);

  const handleToggle = async (field) => {
    const currentValue = Number(settings[field] || 0);
    const nextValue = currentValue ? 0 : 1;
    const previousSettings = settings;
    const optimistic = { ...settings, [field]: nextValue };

    setSettings(optimistic);
    setSavingField(field);
    setErrorText("");

    try {
      const result = await updateNotificationSettings({ [field]: nextValue });
      const nextSettings = normalizeSettings(result.data);
      setSettings(nextSettings);

      if (RESYNC_FIELDS.has(field)) {
        await syncMedicationReminders();
      }
    } catch (error) {
      setSettings(previousSettings);
      setErrorText(error?.message || "Không cập nhật được cài đặt thông báo.");
    } finally {
      setSavingField("");
    }
  };

  const handleResyncReminders = async () => {
    setDebugBusy("sync");
    setErrorText("");

    try {
      const result = await syncMedicationReminders();
      const count = await getScheduledMedicationReminderCount();
      Alert.alert(
        "Đồng bộ xong",
        `Đã lên lịch ${result?.scheduled ?? 0} nhắc nhở.\nTổng thông báo đang chờ: ${count}.`
      );
    } catch (error) {
      setErrorText(error?.message || "Không đồng bộ được lịch nhắc.");
    } finally {
      setDebugBusy("");
    }
  };

  const handleDebugNotification = async () => {
    setDebugBusy("test");
    setErrorText("");

    try {
      const result = await scheduleDebugMedicationNotification();
      if (result?.skipped) {
        setErrorText("Chưa có quyền thông báo trên thiết bị.");
        return;
      }

      Alert.alert("Đã tạo thông báo test", "Bạn sẽ nhận được một thông báo sau khoảng 10 giây.");
    } catch (error) {
      setErrorText(error?.message || "Không tạo được thông báo test.");
    } finally {
      setDebugBusy("");
    }
  };

  const renderSettingCard = (item) => {
    const value = Boolean(Number(settings[item.field] || 0));
    const subtitle = item.subtitleFromSettings
      ? `${formatTime(settings.quiet_start)} - ${formatTime(settings.quiet_end)}`
      : item.subtitle;
    const iconColor = value ? item.iconColorActive || item.iconColor : item.iconColor;
    const icon =
      item.iconLib === "material" ? (
        <MaterialCommunityIcons name={item.iconName} size={20} color={iconColor} />
      ) : (
        <Ionicons name={item.iconName} size={20} color={iconColor} />
      );

    return (
      <View key={item.field} style={styles.settingCard}>
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: value ? item.iconBgActive || item.iconBg : item.iconBgInactive || item.iconBg },
          ]}
        >
          {icon}
        </View>
        <View style={styles.settingBody}>
          <Text style={[styles.settingTitle, value && styles.settingTitleActive]}>{item.title}</Text>
          {subtitle ? (
            <Text style={[styles.settingSubtitle, value && styles.settingSubtitleActive]}>{subtitle}</Text>
          ) : null}
        </View>
        <View style={styles.switchWrap}>
          {savingField === item.field ? (
            <ActivityIndicator color="#2b8d62" />
          ) : (
            <Switch
              value={value}
              onValueChange={() => handleToggle(item.field)}
              trackColor={{ false: "#c8cad1", true: "#24b36b" }}
              thumbColor="#ffffff"
              ios_backgroundColor="#c8cad1"
            />
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#556274" />
          </Pressable>
          <Text style={styles.headerTitle}>Cài đặt thông báo</Text>
          <View style={styles.headerSpacer} />
        </View>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator color="#2b8d62" />
            <Text style={styles.loadingText}>Đang tải cài đặt...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.introCard}>
              <Text style={styles.introTitle}>Quản lý cách ứng dụng nhắc bạn mỗi ngày</Text>
              <Text style={styles.introText}>
                Bật hoặc tắt từng loại thông báo để phù hợp với thói quen dùng điện thoại của bạn.
              </Text>
            </View>

            {!!errorText ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={18} color="#d9545c" />
                <Text style={styles.errorText}>{errorText}</Text>
              </View>
            ) : null}

            <View style={styles.debugCard}>
              <Text style={styles.debugTitle}>Kiểm tra nhanh thông báo</Text>
              <View style={styles.debugActions}>
                <Pressable
                  style={[styles.debugButton, debugBusy === "test" && styles.debugButtonDisabled]}
                  onPress={handleDebugNotification}
                  disabled={debugBusy !== ""}
                >
                  {debugBusy === "test" ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <>
                      <Ionicons name="flash-outline" size={16} color="#ffffff" />
                      <Text style={styles.debugButtonText}>Test 10 giây</Text>
                    </>
                  )}
                </Pressable>
                <Pressable
                  style={[styles.debugButtonSecondary, debugBusy === "sync" && styles.debugButtonDisabled]}
                  onPress={handleResyncReminders}
                  disabled={debugBusy !== ""}
                >
                  {debugBusy === "sync" ? (
                    <ActivityIndicator color="#1f8f59" />
                  ) : (
                    <>
                      <Ionicons name="refresh-outline" size={16} color="#1f8f59" />
                      <Text style={styles.debugButtonSecondaryText}>Đồng bộ lại</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>

            {SETTING_GROUPS.map((group) => (
              <View key={group.key} style={styles.groupWrap}>
                {group.title ? <Text style={styles.groupTitle}>{group.title}</Text> : null}
                {group.items.map(renderSettingCard)}
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f2f3f6",
  },
  screen: {
    flex: 1,
    backgroundColor: "#f2f3f6",
  },
  header: {
    height: 60,
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
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 28,
    fontWeight: "700",
    color: "#243243",
  },
  headerSpacer: {
    width: 36,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 42,
  },
  introCard: {
    borderRadius: 20,
    backgroundColor: "#eef7f1",
    paddingHorizontal: 16,
    paddingVertical: 15,
    marginBottom: 14,
  },
  introTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#213347",
  },
  introText: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: "#66768b",
  },
  debugCard: {
    marginBottom: 16,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    padding: 14,
    shadowColor: "#000000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#243243",
    marginBottom: 10,
  },
  debugActions: {
    flexDirection: "row",
    gap: 10,
  },
  debugButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: "#24b36b",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  debugButtonSecondary: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: "#edf8f1",
    borderWidth: 1,
    borderColor: "#cfe8d8",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  debugButtonDisabled: {
    opacity: 0.7,
  },
  debugButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
  },
  debugButtonSecondaryText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1f8f59",
  },
  groupWrap: {
    marginBottom: 20,
    gap: 12,
  },
  groupTitle: {
    marginTop: 2,
    marginBottom: 0,
    paddingHorizontal: 4,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "#8c95a5",
  },
  settingCard: {
    minHeight: 78,
    borderRadius: 22,
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  settingBody: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2b3442",
  },
  settingTitleActive: {
    color: "#1c8f59",
  },
  settingSubtitle: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
    color: "#8c96a7",
  },
  settingSubtitleActive: {
    color: "#5f8f76",
  },
  switchWrap: {
    width: 56,
    alignItems: "flex-end",
    justifyContent: "center",
    marginLeft: 8,
  },
  centerBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#718094",
  },
  errorBanner: {
    marginBottom: 14,
    borderRadius: 16,
    backgroundColor: "#fff1f2",
    borderWidth: 1,
    borderColor: "#ffd8dc",
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: "#de4c57",
    lineHeight: 20,
  },
});
