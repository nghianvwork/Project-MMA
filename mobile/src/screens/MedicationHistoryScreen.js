import { StatusBar } from "expo-status-bar";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getMedicationLogs, getMedicationSummary } from "../api/medicationLogApi";
import { formatVietnamClock, getVietnamWeekday, toVietnamDateParts, toVietnamSqlDateTime } from "../utils/dateTime";

const RANGE_OPTIONS = [
  { key: "today", label: "Hôm nay" },
  { key: "week", label: "Tuần này" },
  { key: "month", label: "Tháng này" },
];

const toDateTimeInput = (date) => {
  return toVietnamSqlDateTime(date);
};

const getRangeDates = (rangeKey) => {
  const now = new Date();
  const parts = toVietnamDateParts(now);
  const end = new Date(now);
  let start;

  if (rangeKey === "today") {
    start = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, -7, 0, 0));
  } else if (rangeKey === "week") {
    const weekday = getVietnamWeekday(now);
    const diff = weekday === 0 ? 6 : weekday - 1;
    start = new Date(Date.UTC(parts.year, parts.month - 1, parts.day - diff, -7, 0, 0));
  } else {
    start = new Date(Date.UTC(parts.year, parts.month - 1, 1, -7, 0, 0));
  }

  const endOfDay = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 16, 59, 59));

  return {
    from: toDateTimeInput(start),
    to: rangeKey === "today" ? toDateTimeInput(endOfDay) : toDateTimeInput(end),
  };
};

const STATUS_META = {
  taken_on_time: {
    icon: "checkmark-circle",
    iconColor: "#2fb56b",
    badgeText: "ĐÚNG GIỜ",
    badgeBg: "#e8f8ef",
    badgeColor: "#2d9f63",
  },
  late: {
    icon: "time",
    iconColor: "#f5b23f",
    badgeText: "TRỄ",
    badgeBg: "#fff5df",
    badgeColor: "#cc9131",
  },
  missed: {
    icon: "close-circle",
    iconColor: "#ef5a5a",
    badgeText: "BỎ LỠ",
    badgeBg: "#ffe9e9",
    badgeColor: "#d95757",
  },
  snoozed: {
    icon: "alarm",
    iconColor: "#f5b23f",
    badgeText: "TẠM HOÃN",
    badgeBg: "#fff5df",
    badgeColor: "#cc9131",
  },
};

const getStatusMeta = (status) => STATUS_META[status] || STATUS_META.taken_on_time;

const formatClock = (value) => {
  return formatVietnamClock(value);
};

export default function MedicationHistoryScreen({ route, navigation }) {
  const session = route?.params?.session || null;
  const selectedMemberLabel = route?.params?.selectedMemberLabel || "Tôi";
  const isViewingSelf = route?.params?.isViewingSelf !== false;
  const token = session?.token || process.env.EXPO_PUBLIC_AUTH_TOKEN || "";

  const [rangeKey, setRangeKey] = useState("today");
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [summary, setSummary] = useState({ adherence_percent: 0, total: 0 });
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    let mounted = true;

    const fetchHistory = async () => {
      setLoading(true);
      setErrorText("");

      if (!token) {
        if (mounted) {
          setErrorText("Chưa có token đăng nhập.");
          setLoading(false);
        }
        return;
      }

      if (!isViewingSelf) {
        if (mounted) {
          setSummary({ adherence_percent: 0, total: 0 });
          setLogs([]);
          setLoading(false);
        }
        return;
      }

      try {
        const { from, to } = getRangeDates(rangeKey);
        const [summaryResult, logsResult] = await Promise.all([
          getMedicationSummary({ from, to }),
          getMedicationLogs({ from, to }),
        ]);

        if (!mounted) {
          return;
        }

        setSummary(summaryResult.data || { adherence_percent: 0, total: 0 });
        setLogs(Array.isArray(logsResult.data) ? logsResult.data : []);
        setLoading(false);
      } catch (_error) {
        if (!mounted) {
          return;
        }
        setErrorText("Không thể kết nối backend để lấy lịch sử uống thuốc.");
        setLoading(false);
      }
    };

    fetchHistory();

    return () => {
      mounted = false;
    };
  }, [token, rangeKey, isViewingSelf]);

  const title = useMemo(() => {
    if (isViewingSelf) {
      return "Lịch sử uống thuốc";
    }
    return `Lịch sử uống thuốc của ${selectedMemberLabel}`;
  }, [isViewingSelf, selectedMemberLabel]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#4f6070" />
          </Pressable>
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.rangeRow}>
          {RANGE_OPTIONS.map((option) => {
            const active = option.key === rangeKey;
            return (
              <Pressable
                key={option.key}
                style={[styles.rangeChip, active && styles.rangeChipActive]}
                onPress={() => setRangeKey(option.key)}
              >
                <Text style={[styles.rangeChipText, active && styles.rangeChipTextActive]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>
              {rangeKey === "today" ? "Hôm nay" : rangeKey === "week" ? "Tuần thu tổng thể" : "Tháng tổng thể"}
            </Text>
            <Text style={styles.summaryPercent}>{summary.adherence_percent || 0}%</Text>
            <View style={styles.summaryProgressTrack}>
              <View
                style={[
                  styles.summaryProgressFill,
                  { width: `${Math.max(0, Math.min(100, Number(summary.adherence_percent || 0)))}%` },
                ]}
              />
            </View>
            <Text style={styles.summaryText}>
              {isViewingSelf
                ? `Bạn đã hoàn thành ${summary.total || 0} liều thuốc trong khoảng thời gian này.`
                : `Chưa có thống kê riêng cho ${selectedMemberLabel}.`}
            </Text>
          </View>

          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator color="#2fa363" />
              <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
            </View>
          ) : null}

          {!!errorText && !loading ? <Text style={styles.errorText}>{errorText}</Text> : null}

          {!isViewingSelf && !loading ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Chưa có lịch sử riêng</Text>
              <Text style={styles.emptyText}>
                Backend hiện chưa tách lịch sử uống thuốc riêng theo người thân trên màn này.
              </Text>
            </View>
          ) : null}

          {isViewingSelf &&
            !loading &&
            logs.map((log) => {
              const meta = getStatusMeta(log.status);
              return (
                <View key={log.id} style={styles.logRow}>
                  <View style={[styles.statusIconWrap, { backgroundColor: meta.badgeBg }]}>
                    <Ionicons name={meta.icon} size={22} color={meta.iconColor} />
                  </View>

                  <View style={styles.logCard}>
                    <View style={styles.logTopRow}>
                      <Text style={styles.logName}>
                        {log.medicine_name || `Thuốc #${log.medicine_id}`}
                        {log.dosage ? ` ${log.dosage}` : ""}
                      </Text>
                      <MaterialCommunityIcons name="message-text-outline" size={18} color="#9aa4b2" />
                    </View>

                    <View style={styles.logTimeRow}>
                      <View style={styles.timePill}>
                        <Ionicons name="time-outline" size={14} color="#8c97a8" />
                        <Text style={styles.timeText}>Dự kiến: {formatClock(log.scheduled_time)}</Text>
                      </View>
                      {log.taken_time ? (
                        <View style={styles.timePill}>
                          <Ionicons name="checkmark-done-outline" size={14} color="#8c97a8" />
                          <Text style={styles.timeText}>Đã uống: {formatClock(log.taken_time)}</Text>
                        </View>
                      ) : null}
                    </View>

                    <View style={[styles.statusBadge, { backgroundColor: meta.badgeBg }]}>
                      <Text style={[styles.statusBadgeText, { color: meta.badgeColor }]}>
                        {meta.badgeText}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}

          {isViewingSelf && !loading && logs.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Chưa có lịch sử uống thuốc</Text>
              <Text style={styles.emptyText}>Backend chưa có log uống thuốc trong khoảng thời gian này.</Text>
            </View>
          ) : null}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f6f8fb",
  },
  screen: {
    flex: 1,
    backgroundColor: "#f6f8fb",
  },
  header: {
    height: 56,
    paddingHorizontal: 12,
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
    fontSize: 24,
    fontWeight: "700",
    color: "#15243e",
  },
  headerSpacer: {
    width: 36,
  },
  rangeRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  rangeChip: {
    flex: 1,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e6ebf1",
  },
  rangeChipActive: {
    backgroundColor: "#f1f8f3",
    borderColor: "#d8eeda",
  },
  rangeChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8390a0",
  },
  rangeChipTextActive: {
    color: "#2d8b58",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 120,
  },
  summaryCard: {
    borderRadius: 22,
    backgroundColor: "#38b76b",
    padding: 18,
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(255,255,255,0.9)",
  },
  summaryPercent: {
    marginTop: 4,
    fontSize: 42,
    lineHeight: 46,
    fontWeight: "800",
    color: "#ffffff",
  },
  summaryProgressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginTop: 12,
    overflow: "hidden",
  },
  summaryProgressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#ffffff",
  },
  summaryText: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(255,255,255,0.92)",
  },
  centerBox: {
    alignItems: "center",
    paddingVertical: 18,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: "#6f7d90",
  },
  errorText: {
    color: "#e24f56",
    fontSize: 14,
    marginBottom: 12,
  },
  logRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 14,
  },
  statusIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
  logCard: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    padding: 16,
  },
  logTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  logName: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: "#23324a",
  },
  logTimeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
  },
  timePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  timeText: {
    fontSize: 13,
    color: "#8a96a7",
  },
  statusBadge: {
    alignSelf: "flex-start",
    marginTop: 10,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  emptyCard: {
    borderRadius: 18,
    backgroundColor: "#ffffff",
    padding: 18,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#23324a",
  },
  emptyText: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: "#7d8999",
  },
});
