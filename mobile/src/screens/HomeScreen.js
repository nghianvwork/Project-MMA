import { StatusBar } from "expo-status-bar";
import {
  Feather,
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  formatApiBaseCandidates,
  requestJsonWithFallback,
} from "../utils/apiClient";

const ENV_USER_ID = process.env.EXPO_PUBLIC_USER_ID || "user123";
const ENV_USER_NAME = process.env.EXPO_PUBLIC_USER_NAME || "";
const ENV_BEARER_TOKEN = process.env.EXPO_PUBLIC_AUTH_TOKEN || "";

const QUICK_ACCESS = [
  { label: "Kho thuốc", icon: "archive-outline", bg: "#d2efe9", color: "#20d7c2" },
  { label: "Báo cáo", icon: "bar-chart-outline", bg: "#dce8f5", color: "#5b8df8" },
  { label: "Bác sĩ", icon: "medical-outline", bg: "#ebe0f8", color: "#a055f8" },
  { label: "Nhà thuốc", icon: "location-outline", bg: "#faecdb", color: "#ff9b3d" },
];

const TAB_ITEMS = [
  { label: "Trang chủ", icon: "home", active: true },
  { label: "Lịch", icon: "calendar-clear-outline", active: false },
  { label: "Kho thuốc", icon: "cube-outline", active: false },
  { label: "Hồ sơ", icon: "person-outline", active: false },
];

const DAY_NAMES = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const WEEKDAY_HEADER = [
  "CHỦ NHẬT",
  "THỨ HAI",
  "THỨ BA",
  "THỨ TƯ",
  "THỨ NĂM",
  "THỨ SÁU",
  "THỨ BẢY",
];

const toApiDate = (date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toHeaderDateText = (date) =>
  `${WEEKDAY_HEADER[date.getDay()]}, ${date.getDate()} THÁNG ${date.getMonth() + 1}`;

const getGreetingByTime = (date) => {
  const hour = date.getHours();
  if (hour < 12) {
    return "Chào buổi sáng";
  }
  if (hour < 18) {
    return "Chào buổi chiều";
  }
  return "Chào buổi tối";
};

const toTimeLabel = (timeValue) => {
  if (!timeValue) {
    return "00:00";
  }
  return String(timeValue).slice(0, 5);
};

const toMinutes = (timeValue) => {
  if (!timeValue) {
    return 0;
  }
  const [hourString = "0", minuteString = "0"] = String(timeValue).split(":");
  const hour = Number(hourString) || 0;
  const minute = Number(minuteString) || 0;
  return hour * 60 + minute;
};

const toPeriodName = (timeValue) => {
  const minutes = toMinutes(timeValue);
  if (minutes < 11 * 60) {
    return "Sáng";
  }
  if (minutes < 14 * 60) {
    return "Trưa";
  }
  if (minutes < 18 * 60) {
    return "Chiều";
  }
  return "Tối";
};

const mapIconByMedicineName = (nameValue) => {
  const normalized = (nameValue || "").toLowerCase();
  if (normalized.includes("siro") || normalized.includes("ho")) {
    return "bottle-tonic-plus";
  }
  if (normalized.includes("vitamin")) {
    return "medical-bag";
  }
  return "pill";
};

const buildDateChips = (selectedDate) => {
  const mondayOffset = (selectedDate.getDay() + 6) % 7;
  const monday = new Date(selectedDate);
  monday.setDate(selectedDate.getDate() - mondayOffset);

  return Array.from({ length: 5 }).map((_, index) => {
    const current = new Date(monday);
    current.setDate(monday.getDate() + index);
    return {
      date: current,
      label: DAY_NAMES[current.getDay()],
      day: `${current.getDate()}`.padStart(2, "0"),
      key: toApiDate(current),
    };
  });
};

const isPastDate = (targetDate, nowDate) =>
  toApiDate(targetDate) < toApiDate(nowDate);

const isFutureDate = (targetDate, nowDate) =>
  toApiDate(targetDate) > toApiDate(nowDate);

const getPeriodBucket = (minutes) => {
  if (minutes < 12 * 60) {
    return "morning";
  }
  if (minutes < 18 * 60) {
    return "noon";
  }
  return "evening";
};

const getStatusStyle = (statusValue) => {
  if (statusValue === "Đã xong") {
    return styles.statusDone;
  }
  if (statusValue === "Đang chờ") {
    return styles.statusWait;
  }
  return styles.statusNext;
};

const extractDisplayNameFromProfile = (profile) => {
  if (!profile || typeof profile !== "object") {
    return "";
  }
  return (
    profile.display_name ||
    profile.username ||
    (profile.email ? String(profile.email).split("@")[0] : "") ||
    ""
  );
};

const extractNameFromEmail = (email) => {
  if (!email) {
    return "";
  }
  return String(email).split("@")[0] || "";
};

const decodeJwtPayload = (token) => {
  if (!token || typeof atob !== "function") {
    return {};
  }

  try {
    const payloadPart = String(token).split(".")[1] || "";
    if (!payloadPart) {
      return {};
    }

    const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padding = base64.length % 4;
    const padded = padding ? `${base64}${"=".repeat(4 - padding)}` : base64;
    const decoded = atob(padded);
    return JSON.parse(decoded);
  } catch (_error) {
    return {};
  }
};

export default function HomeScreen({ session }) {
  const sessionToken = session?.token || "";
  const sessionPayload = useMemo(() => decodeJwtPayload(sessionToken), [sessionToken]);
  const sessionUser = session?.user || null;
  const sessionUserId = sessionUser?.id || sessionPayload?.id || "";
  const sessionEmail = sessionUser?.email || sessionPayload?.email || session?.email || "";
  const sessionName =
    extractDisplayNameFromProfile(sessionUser) || extractNameFromEmail(sessionEmail);
  const currentUserId = sessionUserId || ENV_USER_ID;
  const currentToken = sessionToken || ENV_BEARER_TOKEN;

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userName, setUserName] = useState(ENV_USER_NAME || sessionName || currentUserId);
  const [schedules, setSchedules] = useState([]);
  const [lowStockMedicines, setLowStockMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchUserProfile = useCallback(async () => {
    if (ENV_USER_NAME) {
      setUserName(ENV_USER_NAME);
      return;
    }

    if (sessionName) {
      setUserName(sessionName);
    }

    if (!currentToken) {
      setUserName(sessionName || currentUserId);
      return;
    }

    try {
      const { response, data } = await requestJsonWithFallback("/api/user/profile", {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });
      if (!response.ok) {
        setUserName(sessionName || currentUserId);
        return;
      }

      const displayName = extractDisplayNameFromProfile(data);
      setUserName(displayName || sessionName || currentUserId);
    } catch (_error) {
      setUserName(sessionName || currentUserId);
    }
  }, [currentToken, currentUserId, sessionName]);

  const dateChips = useMemo(() => buildDateChips(selectedDate), [selectedDate]);

  const fetchHomeData = useCallback(
    async (dateValue, isRefresh = false) => {
      if (!currentUserId) {
        setErrorMessage("Thiếu EXPO_PUBLIC_USER_ID để gọi API backend.");
        setLoading(false);
        return;
      }

      const apiDate = toApiDate(dateValue);
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setErrorMessage("");

      try {
        const headers = {
          "Content-Type": "application/json",
          "x-user-id": currentUserId,
        };

        const [
          { response: scheduleResponse, data: scheduleJson },
          { response: lowStockResponse, data: lowStockJson },
        ] = await Promise.all([
          requestJsonWithFallback(`/api/schedules/date/${apiDate}`, { headers }),
          requestJsonWithFallback("/api/medicines/low-stock", { headers }),
        ]);

        if (!scheduleResponse.ok) {
          throw new Error(scheduleJson.message || "Không tải được lịch uống thuốc.");
        }
        if (!lowStockResponse.ok) {
          throw new Error(lowStockJson.message || "Không tải được cảnh báo thuốc.");
        }

        setSchedules(Array.isArray(scheduleJson.data) ? scheduleJson.data : []);
        setLowStockMedicines(Array.isArray(lowStockJson.data) ? lowStockJson.data : []);
      } catch (error) {
        setErrorMessage(
          error.message ||
            `Không thể kết nối backend. URL đã thử: ${formatApiBaseCandidates()}`,
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [currentUserId],
  );

  useEffect(() => {
    fetchHomeData(selectedDate, false);
  }, [selectedDate, fetchHomeData]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const scheduleItems = useMemo(() => {
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const selectedIsPast = isPastDate(selectedDate, now);
    const selectedIsFuture = isFutureDate(selectedDate, now);
    let highlightedAssigned = false;

    return schedules.map((item) => {
      const minutes = toMinutes(item.time_of_day);
      const done = selectedIsPast ? true : selectedIsFuture ? false : minutes <= nowMinutes;
      const shouldHighlight = !done && !highlightedAssigned;
      if (shouldHighlight) {
        highlightedAssigned = true;
      }

      const doseAmount = item.dose_amount ? `${item.dose_amount} liều` : "1 liều";
      const desc = `${doseAmount} • ${toTimeLabel(item.time_of_day)} ${toPeriodName(item.time_of_day)}`;

      return {
        id: item.id,
        name: item.medicine_name || "Không rõ tên thuốc",
        desc,
        icon: mapIconByMedicineName(item.medicine_name),
        done,
        highlight: shouldHighlight,
        action: shouldHighlight ? "Uống" : "",
        minutes,
      };
    });
  }, [schedules, selectedDate]);

  const progressStats = useMemo(() => {
    const total = scheduleItems.length;
    const done = scheduleItems.filter((item) => item.done).length;
    const percent = total > 0 ? Math.round((done * 100) / total) : 0;

    const periodStats = {
      morning: { total: 0, done: 0 },
      noon: { total: 0, done: 0 },
      evening: { total: 0, done: 0 },
    };

    scheduleItems.forEach((item) => {
      const bucket = getPeriodBucket(item.minutes);
      periodStats[bucket].total += 1;
      if (item.done) {
        periodStats[bucket].done += 1;
      }
    });

    const now = new Date();
    const currentBucket = getPeriodBucket(now.getHours() * 60 + now.getMinutes());
    const selectedIsPast = isPastDate(selectedDate, now);
    const selectedIsFuture = isFutureDate(selectedDate, now);

    const getPeriodStatus = (bucketName) => {
      const bucket = periodStats[bucketName];
      if (bucket.total > 0 && bucket.done === bucket.total) {
        return "Đã xong";
      }
      if (selectedIsPast) {
        return "Đã xong";
      }
      if (selectedIsFuture) {
        return "Sắp tới";
      }
      if (bucketName === currentBucket) {
        return "Đang chờ";
      }
      const order = ["morning", "noon", "evening"];
      return order.indexOf(bucketName) < order.indexOf(currentBucket)
        ? "Đã xong"
        : "Sắp tới";
    };

    return {
      done,
      total,
      percent,
      morningStatus: getPeriodStatus("morning"),
      noonStatus: getPeriodStatus("noon"),
      eveningStatus: getPeriodStatus("evening"),
    };
  }, [scheduleItems, selectedDate]);

  const warningItems = useMemo(() => {
    return lowStockMedicines.slice(0, 2).map((item, index) => {
      const threshold = Number(item.low_stock_threshold || 1);
      const stock = Number(item.stock_quantity || 0);
      const base = Math.max(1, threshold * 2);
      const percent = Math.max(6, Math.min(100, Math.round((stock / base) * 100)));
      return {
        id: item.id,
        name: item.name || "Không rõ",
        remaining: stock,
        percent,
        tone: index === 0 ? "red" : "yellow",
      };
    });
  }, [lowStockMedicines]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.phoneFrame}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.greetingCard}>
            <View style={styles.greetingLeft}>
              <View style={styles.avatarWrap}>
                <Text style={styles.avatarText}>👨🏻</Text>
              </View>
              <View>
                <Text style={styles.dateText}>{toHeaderDateText(selectedDate)}</Text>
                <Text style={styles.greetingText}>
                  {getGreetingByTime(currentTime)}, {userName}!
                </Text>
              </View>
            </View>
            <Pressable style={styles.bellButton}>
              <Feather name="bell" size={20} color="#6e7b91" />
              <View style={styles.bellDot} />
            </Pressable>
          </View>

          <View style={styles.progressCard}>
            <View style={styles.progressLeft}>
              <Text style={styles.progressTitle}>Tiến độ hôm nay</Text>
              <View style={styles.progressLine}>
                <Text style={styles.progressValue}>
                  {progressStats.done}/{progressStats.total}
                </Text>
                <Text style={styles.progressSub}> LIỀU ĐÃ UỐNG</Text>
              </View>
            </View>
            <View style={styles.progressRingOuter}>
              <View style={styles.progressRingInner}>
                <Text style={styles.progressPercent}>{progressStats.percent}%</Text>
              </View>
            </View>
            <View style={styles.progressFooter}>
              <View style={styles.progressCol}>
                <Text style={styles.progressLabel}>SÁNG</Text>
                <Text style={[styles.progressStatus, getStatusStyle(progressStats.morningStatus)]}>
                  {progressStats.morningStatus}
                </Text>
              </View>
              <View style={styles.progressCol}>
                <Text style={styles.progressLabel}>TRƯA</Text>
                <Text style={[styles.progressStatus, getStatusStyle(progressStats.noonStatus)]}>
                  {progressStats.noonStatus}
                </Text>
              </View>
              <View style={styles.progressCol}>
                <Text style={styles.progressLabel}>TỐI</Text>
                <Text style={[styles.progressStatus, getStatusStyle(progressStats.eveningStatus)]}>
                  {progressStats.eveningStatus}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Lịch uống thuốc</Text>
            <Pressable style={styles.detailBtn} onPress={() => fetchHomeData(selectedDate, true)}>
              {refreshing ? (
                <ActivityIndicator size="small" color="#1dd8c7" />
              ) : (
                <Text style={styles.detailText}>Làm mới</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.daysRow}>
            {dateChips.map((item) => {
              const active = toApiDate(selectedDate) === item.key;
              return (
                <Pressable
                  key={item.key}
                  style={[styles.dayChip, active && styles.dayChipActive]}
                  onPress={() => setSelectedDate(new Date(item.date))}
                >
                  <Text style={[styles.dayLabel, active && styles.dayLabelActive]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.dayValue, active && styles.dayValueActive]}>
                    {item.day}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color="#1dd8c7" />
              <Text style={styles.loadingText}>Đang tải dữ liệu từ backend...</Text>
            </View>
          ) : (
            <>
              {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
              {scheduleItems.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>
                    Chưa có lịch uống thuốc cho ngày {toApiDate(selectedDate)}.
                  </Text>
                </View>
              ) : (
                scheduleItems.map((item) => (
                  <View
                    key={item.id}
                    style={[
                      styles.medicineCard,
                      item.highlight && styles.medicineCardHighlight,
                      item.done && styles.medicineCardDone,
                    ]}
                  >
                    <View
                      style={[
                        styles.medicineIconWrap,
                        item.done && styles.medicineIconDone,
                        item.highlight && styles.medicineIconHighlight,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={item.icon}
                        size={22}
                        color={item.highlight ? "#21d7c2" : item.done ? "#adb7c7" : "#5f8ff5"}
                      />
                    </View>
                    <View style={styles.medicineBody}>
                      <Text style={[styles.medicineName, item.done && styles.medicineNameDone]}>
                        {item.name}
                      </Text>
                      <Text style={styles.medicineDesc}>{item.desc}</Text>
                    </View>
                    {item.action ? (
                      <Pressable style={styles.takeBtn}>
                        <Text style={styles.takeBtnText}>{item.action}</Text>
                      </Pressable>
                    ) : item.done ? (
                      <View style={styles.doneCircle}>
                        <Ionicons name="checkmark" size={18} color="#ffffff" />
                      </View>
                    ) : (
                      <View style={styles.emptyCircle} />
                    )}
                  </View>
                ))
              )}
            </>
          )}

          <View style={styles.warningHead}>
            <Text style={styles.warningIcon}>❗</Text>
            <Text style={styles.sectionTitle}>Cảnh báo sắp hết thuốc</Text>
          </View>

          {warningItems.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Không có thuốc sắp hết tồn kho.</Text>
            </View>
          ) : (
            <View style={styles.warningRow}>
              {warningItems.map((item) => {
                const redTone = item.tone === "red";
                return (
                  <View
                    key={item.id}
                    style={[
                      styles.warningCard,
                      redTone ? styles.warningRedCard : styles.warningYellowCard,
                    ]}
                  >
                    <Text style={[styles.warningCount, redTone ? styles.warningRed : styles.warningYellow]}>
                      Còn {item.remaining} liều
                    </Text>
                    <Text style={styles.warningName}>{item.name}</Text>
                    <View style={styles.warningBarTrack}>
                      <View
                        style={[
                          styles.warningBarFill,
                          { width: `${item.percent}%` },
                          redTone ? styles.warningRedFill : styles.warningYellowFill,
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          <Text style={styles.sectionTitle}>Thông số sức khỏe</Text>
          <View style={styles.healthRow}>
            <View style={styles.healthCard}>
              <View style={styles.healthIconWrap}>
                <Ionicons name="heart-outline" size={18} color="#ff7676" />
              </View>
              <Text style={styles.healthLabel}>NHỊP TIM</Text>
              <Text style={styles.healthValue}>
                72<Text style={styles.healthUnit}> bpm</Text>
              </Text>
              <Text style={styles.healthState}>+Bình thường</Text>
            </View>
            <View style={styles.healthCard}>
              <View style={styles.healthIconWrap}>
                <MaterialCommunityIcons name="stethoscope" size={18} color="#5f8ff5" />
              </View>
              <Text style={styles.healthLabel}>HUYẾT ÁP</Text>
              <Text style={styles.healthValue}>
                120/80<Text style={styles.healthUnit}> mmHg</Text>
              </Text>
              <Text style={styles.healthState}>Ổn định</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Truy cập nhanh</Text>
          <View style={styles.quickAccessRow}>
            {QUICK_ACCESS.map((item) => (
              <View key={item.label} style={styles.quickItem}>
                <View style={[styles.quickIconWrap, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon} size={24} color={item.color} />
                </View>
                <Text style={styles.quickLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        <Pressable style={styles.fab}>
          <Ionicons name="add" size={34} color="#04333a" />
        </Pressable>

        <View style={styles.tabBar}>
          {TAB_ITEMS.map((item) => (
            <Pressable key={item.label} style={styles.tabItem}>
              {item.icon === "home" ? (
                <FontAwesome5
                  name={item.icon}
                  size={18}
                  color={item.active ? "#1dd8c7" : "#a4b0c3"}
                />
              ) : (
                <Ionicons
                  name={item.icon}
                  size={21}
                  color={item.active ? "#1dd8c7" : "#a4b0c3"}
                />
              )}
              <Text style={[styles.tabLabel, item.active && styles.tabLabelActive]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#e7eaed",
  },
  phoneFrame: {
    flex: 1,
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    backgroundColor: "#f3f4f6",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 140,
  },
  greetingCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    shadowColor: "#000000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  greetingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#d7efd7",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 22,
  },
  dateText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8d9ab0",
    letterSpacing: 0.5,
  },
  greetingText: {
    marginTop: 2,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: "700",
    color: "#1c2640",
  },
  bellButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#f6f7fa",
    alignItems: "center",
    justifyContent: "center",
  },
  bellDot: {
    position: "absolute",
    top: 8,
    right: 9,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ff4f57",
  },
  progressCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e8ebf2",
  },
  progressLeft: {
    paddingRight: 130,
  },
  progressTitle: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "700",
    color: "#0f1b34",
  },
  progressLine: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: 4,
  },
  progressValue: {
    fontSize: 40,
    lineHeight: 44,
    fontWeight: "800",
    color: "#1dd8c7",
  },
  progressSub: {
    marginBottom: 6,
    fontSize: 13,
    color: "#9ba7ba",
    fontWeight: "700",
  },
  progressRingOuter: {
    position: "absolute",
    right: 14,
    top: 14,
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 7,
    borderColor: "#d8dde6",
    borderTopColor: "#1dd8c7",
    borderRightColor: "#1dd8c7",
    alignItems: "center",
    justifyContent: "center",
  },
  progressRingInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  progressPercent: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "700",
    color: "#0f1b34",
  },
  progressFooter: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#eef1f6",
    paddingTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressCol: {
    alignItems: "center",
    flex: 1,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#a2adbe",
  },
  progressStatus: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: "700",
  },
  statusDone: {
    color: "#1dd8c7",
  },
  statusWait: {
    color: "#ff9f1a",
  },
  statusNext: {
    color: "#8c98af",
  },
  sectionHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
    color: "#0f1b34",
    marginBottom: 10,
  },
  detailBtn: {
    backgroundColor: "#d9f6ef",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 8,
    minWidth: 76,
    alignItems: "center",
    justifyContent: "center",
  },
  detailText: {
    color: "#1dd8c7",
    fontWeight: "700",
    fontSize: 13,
  },
  daysRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  dayChip: {
    width: 50,
    height: 58,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  dayChipActive: {
    backgroundColor: "#1dd8c7",
  },
  dayLabel: {
    color: "#9da8ba",
    fontWeight: "700",
    fontSize: 12,
  },
  dayLabelActive: {
    color: "#0e3a45",
  },
  dayValue: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "700",
    color: "#1e2b43",
  },
  dayValueActive: {
    color: "#0e3a45",
  },
  loadingWrap: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingVertical: 22,
    alignItems: "center",
    marginBottom: 10,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: "#6f7d92",
  },
  errorText: {
    marginBottom: 10,
    color: "#e14b4b",
    fontSize: 13,
  },
  emptyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: "#758299",
  },
  medicineCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  medicineCardDone: {
    opacity: 0.72,
  },
  medicineCardHighlight: {
    borderLeftWidth: 4,
    borderLeftColor: "#1dd8c7",
  },
  medicineIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#edf3ff",
  },
  medicineIconDone: {
    backgroundColor: "#f0f3f8",
  },
  medicineIconHighlight: {
    backgroundColor: "#ddf7f2",
  },
  medicineBody: {
    flex: 1,
  },
  medicineName: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "700",
    color: "#111d38",
  },
  medicineNameDone: {
    textDecorationLine: "line-through",
    color: "#7d8798",
  },
  medicineDesc: {
    marginTop: 2,
    fontSize: 14,
    color: "#7a879c",
  },
  takeBtn: {
    height: 34,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#1dd8c7",
    alignItems: "center",
    justifyContent: "center",
  },
  takeBtnText: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "700",
    color: "#08333b",
  },
  doneCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#6edfd2",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#d2d8e4",
  },
  warningHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    marginBottom: 10,
  },
  warningIcon: {
    fontSize: 16,
  },
  warningRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },
  warningCard: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
  },
  warningRedCard: {
    backgroundColor: "#ffefef",
    borderColor: "#ffd5d5",
  },
  warningYellowCard: {
    backgroundColor: "#f8f2e3",
    borderColor: "#f1e0b7",
  },
  warningCount: {
    fontSize: 12,
    fontWeight: "700",
  },
  warningRed: {
    color: "#f04e4e",
  },
  warningYellow: {
    color: "#e69b1f",
  },
  warningName: {
    marginTop: 8,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "700",
    color: "#101e3a",
  },
  warningBarTrack: {
    marginTop: 10,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#edd8d8",
  },
  warningBarFill: {
    height: 6,
    borderRadius: 3,
  },
  warningRedFill: {
    backgroundColor: "#ee4343",
  },
  warningYellowFill: {
    backgroundColor: "#e3b33d",
  },
  healthRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },
  healthCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
  },
  healthIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#f7f8fb",
    alignItems: "center",
    justifyContent: "center",
  },
  healthLabel: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "700",
    color: "#8f9bb0",
  },
  healthValue: {
    marginTop: 6,
    fontSize: 38,
    lineHeight: 42,
    fontWeight: "800",
    color: "#0f1b34",
  },
  healthUnit: {
    fontSize: 13,
    color: "#8f9bb0",
    fontWeight: "500",
  },
  healthState: {
    marginTop: 4,
    fontSize: 13,
    color: "#35b85b",
    fontWeight: "700",
  },
  quickAccessRow: {
    flexDirection: "row",
    gap: 10,
  },
  quickItem: {
    flex: 1,
    alignItems: "center",
  },
  quickIconWrap: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  quickLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2f3b54",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 84,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#1dd8c7",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1dd8c7",
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  tabBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 74,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e9edf3",
    flexDirection: "row",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#a4b0c3",
  },
  tabLabelActive: {
    color: "#1dd8c7",
  },
});
