import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getNotificationSettings } from '../api/notificationApi';

// Foreground notification display config
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

const resolveExpoProjectId = () => {
    return (
        Constants?.expoConfig?.extra?.eas?.projectId ||
        Constants?.easConfig?.projectId ||
        Constants?.manifest2?.extra?.eas?.projectId ||
        Constants?.manifest?.extra?.eas?.projectId ||
        process.env.EXPO_PUBLIC_EAS_PROJECT_ID ||
        ''
    );
};

let cachedExpoPushToken = null;
let pendingExpoPushTokenPromise = null;
let didLogMissingProjectId = false;

/**
 * Request notification permissions and setup Android channel.
 * Returns true if granted.
 */
export async function requestPermissions() {
    if (!Device.isDevice) {
        console.log('[Notification] Chỉ hoạt động trên thiết bị thật');
        return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.log('[Notification] Không có quyền notification');
        return false;
    }

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('medicine-reminders', {
            name: 'Nhắc uống thuốc',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#2E7D6F',
            sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('low-stock-alerts', {
            name: 'Cảnh báo hết thuốc',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#F5A623',
            sound: 'default',
        });
    }

    return true;
}

/**
 * Get Expo Push Token for server push notifications.
 */
export async function getExpoPushToken() {
    if (cachedExpoPushToken) {
        return cachedExpoPushToken;
    }

    if (pendingExpoPushTokenPromise) {
        return pendingExpoPushTokenPromise;
    }

    const projectId = resolveExpoProjectId();
    if (!projectId) {
        if (!didLogMissingProjectId) {
            console.log(
                '[Notification] Chưa có Expo projectId. Bỏ qua đăng ký push token. Hãy cấu hình EXPO_PUBLIC_EAS_PROJECT_ID hoặc app config extra.eas.projectId.',
            );
            didLogMissingProjectId = true;
        }
        return null;
    }

    pendingExpoPushTokenPromise = (async () => {
        const hasPermission = await requestPermissions();
        if (!hasPermission) return null;

        const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId,
        });
        console.log('[Notification] Expo Push Token:', tokenData.data);
        cachedExpoPushToken = tokenData.data;
        return tokenData.data;
    })();

    try {
        return await pendingExpoPushTokenPromise;
    } catch (error) {
        console.error('[Notification] Lỗi lấy Expo push token:', error?.message || error);
        return null;
    } finally {
        pendingExpoPushTokenPromise = null;
    }
}

/**
 * Schedule a local notification for a medicine schedule.
 * Returns the notification identifier for cancellation.
 */
export async function scheduleLocalNotification({
    scheduleId,
    medicineId,
    medicineName,
    dosage,
    doseAmount,
    form,
    triggerDate, // Date object for when to fire
}) {
    const identifier = await Notifications.scheduleNotificationAsync({
        content: {
            title: '⏰ Đến giờ uống thuốc!',
            body: `${medicineName} ${dosage || ''} - ${doseAmount || 1} ${form || 'viên'}`,
            data: {
                type: 'schedule_reminder',
                scheduleId,
                medicineId,
                medicineName,
                dosage,
                doseAmount,
                form,
            },
            sound: 'default',
            ...(Platform.OS === 'android' && { channelId: 'medicine-reminders' }),
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: triggerDate,
        },
    });

    return identifier;
}

/**
 * Schedule a snooze notification (10 minutes from now).
 */
export async function scheduleSnoozeNotification({ scheduleId, medicineId, medicineName, dosage, doseAmount, form }) {
    const snoozeDate = new Date(Date.now() + 10 * 60 * 1000);

    return scheduleLocalNotification({
        scheduleId,
        medicineId,
        medicineName,
        dosage,
        doseAmount,
        form,
        triggerDate: snoozeDate,
    });
}

/**
 * Send a one-time low stock notification.
 */
export async function sendLowStockNotification({ medicineId, medicineName, stockQuantity, stockUnit }) {
    await Notifications.scheduleNotificationAsync({
        content: {
            title: '⚠️ Thuốc sắp hết!',
            body: `${medicineName} chỉ còn ${stockQuantity} ${stockUnit || 'viên'}. Hãy bổ sung thêm.`,
            data: {
                type: 'low_stock',
                medicineId,
            },
            sound: 'default',
            ...(Platform.OS === 'android' && { channelId: 'low-stock-alerts' }),
        },
        trigger: null, // fire immediately
    });
}

/**
 * Cancel a specific scheduled notification.
 */
export async function cancelNotification(identifier) {
    await Notifications.cancelScheduledNotificationAsync(identifier);
}

/**
 * Cancel all scheduled notifications.
 */
export async function cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Setup notification listeners.
 * - foregroundSubscription: handles notification received while app is in foreground
 * - responseSubscription: handles user tapping the notification
 *
 * @param {object} navigationRef - React Navigation ref for navigating on tap
 * @returns {Function} cleanup function to remove listeners
 */
export function setupNotificationListeners(navigationRef) {
    // Notification received in foreground (already handled by setNotificationHandler)
    const foregroundSub = Notifications.addNotificationReceivedListener((notification) => {
        console.log('[Notification] Received in foreground:', notification.request.content.title);
    });

    // User tapped on notification
    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        console.log('[Notification] User tapped:', data);

        if (data.type === 'schedule_reminder' && navigationRef?.current) {
            navigationRef.current.navigate('Alarm', {
                schedule: {
                    id: data.scheduleId,
                    medicine_id: data.medicineId,
                    medicine_name: data.medicineName,
                    dosage: data.dosage,
                    dose_amount: data.doseAmount,
                    form: data.form,
                },
            });
        }
    });

    return () => {
        foregroundSub.remove();
        responseSub.remove();
    };
}

/**
 * Check for low-stock medicines and send notifications for new ones.
 * Tracks already-notified medicines in AsyncStorage to avoid spam.
 */
export async function checkAndNotifyLowStock(lowStockMeds) {
    if (!lowStockMeds || lowStockMeds.length === 0) return;

    try {
        const settingsResponse = await getNotificationSettings();
        const settings = settingsResponse?.data || {};

        if (!Number(settings?.low_stock_alert ?? 1)) {
            return;
        }
    } catch {
        // Keep default behavior when settings endpoint is temporarily unavailable.
    }

    const today = new Date().toISOString().split('T')[0];
    const storageKey = `low_stock_notified_${today}`;

    let notifiedIds = [];
    try {
        const stored = await AsyncStorage.getItem(storageKey);
        if (stored) notifiedIds = JSON.parse(stored);
    } catch { }

    for (const med of lowStockMeds) {
        if (notifiedIds.includes(med.id)) continue;

        await sendLowStockNotification({
            medicineId: med.id,
            medicineName: med.name,
            stockQuantity: med.stock_quantity,
            stockUnit: med.stock_unit,
        });

        notifiedIds.push(med.id);
    }

    try {
        await AsyncStorage.setItem(storageKey, JSON.stringify(notifiedIds));
    } catch { }
}
