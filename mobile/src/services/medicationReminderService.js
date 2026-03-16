import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getNotificationSettings } from '../api/notificationApi';
import { getSchedules } from '../api/scheduleApi';

const STORAGE_KEY = 'medication_reminder_notification_ids_v1';
const REMINDER_CHANNEL_ID = 'medication-reminders';
const REMINDER_HORIZON_DAYS = 60;

const DEFAULT_NOTIFICATION_SETTINGS = {
    remind_medicine: 1,
    sound: 1,
    vibrate: 1,
};

let configured = false;

const parseTimeOfDay = (timeOfDay) => {
    const [hour = '0', minute = '0'] = String(timeOfDay || '00:00:00').split(':');
    return {
        hour: Number(hour) || 0,
        minute: Number(minute) || 0,
    };
};

const parseDateOnly = (dateString) => {
    const raw = String(dateString || '').trim();
    const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (match) {
        const [, year, month, day] = match;
        return new Date(Number(year), Number(month) - 1, Number(day), 0, 0, 0, 0);
    }

    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) {
        return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 0, 0, 0, 0);
    }

    return new Date(1970, 0, 1, 0, 0, 0, 0);
};

const isSameOrAfterDay = (left, right) =>
    left.getFullYear() > right.getFullYear() ||
    (left.getFullYear() === right.getFullYear() &&
        (left.getMonth() > right.getMonth() ||
            (left.getMonth() === right.getMonth() && left.getDate() >= right.getDate())));

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);

const diffDays = (left, right) => {
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.floor((startOfDay(left).getTime() - startOfDay(right).getTime()) / msPerDay);
};

const buildNotificationContent = (schedule, settings) => ({
    title: 'Den gio uong thuoc',
    body: `${schedule.medicine_name || 'Thuoc'}${schedule.dosage ? ` - ${schedule.dosage}` : ''}`,
    sound: Number(settings.sound ?? 1) ? true : false,
    data: {
        scheduleId: schedule.id,
        medicineId: schedule.medicine_id,
    },
    ...(Platform.OS === 'android' ? { channelId: REMINDER_CHANNEL_ID } : {}),
});

const getStoredNotificationIds = async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
        return [];
    }

    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (_error) {
        return [];
    }
};

const setStoredNotificationIds = async (ids) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
};

const cancelStoredMedicationReminders = async () => {
    const ids = await getStoredNotificationIds();
    await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => null)));
    await setStoredNotificationIds([]);
};

const ensureNotificationRuntimeConfigured = async (settings) => {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: Boolean(Number(settings.sound ?? 1)),
            shouldSetBadge: false,
        }),
    });

    if (!configured && Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
            name: 'Nhac uong thuoc',
            importance: Notifications.AndroidImportance.MAX,
            sound: Number(settings.sound ?? 1) ? 'default' : undefined,
            vibrationPattern: Number(settings.vibrate ?? 1) ? [0, 300, 150, 300] : [0],
            lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        });
    }

    configured = true;
};

const requestNotificationPermission = async () => {
    if (Platform.OS === 'web') {
        return false;
    }

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;

    if (status !== 'granted') {
        const requested = await Notifications.requestPermissionsAsync();
        status = requested.status;
    }

    return status === 'granted';
};

const shouldScheduleOnDate = (schedule, candidateDate) => {
    const startDate = parseDateOnly(schedule.start_date);
    const endDate = schedule.end_date ? parseDateOnly(schedule.end_date) : null;
    const day = startOfDay(candidateDate);

    if (!isSameOrAfterDay(day, startDate)) {
        return false;
    }

    if (endDate && !isSameOrAfterDay(endDate, day)) {
        return false;
    }

    if (schedule.rule_type === 'weekdays') {
        const weekdays = String(schedule.weekdays || '')
            .split(',')
            .map((value) => Number(value))
            .filter((value) => Number.isInteger(value) && value >= 0 && value <= 6);
        return weekdays.includes(day.getDay());
    }

    if (schedule.rule_type === 'every_x_days') {
        const intervalDays = Number(schedule.interval_days || 0);
        if (!intervalDays || intervalDays < 1) {
            return false;
        }
        return diffDays(day, startDate) % intervalDays === 0;
    }

    return true;
};

const buildUpcomingTriggerDates = (schedule) => {
    const now = new Date();
    const horizonDate = new Date(now);
    horizonDate.setDate(horizonDate.getDate() + REMINDER_HORIZON_DAYS);

    const { hour, minute } = parseTimeOfDay(schedule.time_of_day);
    const dates = [];

    for (let cursor = startOfDay(now); cursor <= horizonDate; cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1, 0, 0, 0, 0)) {
        if (!shouldScheduleOnDate(schedule, cursor)) {
            continue;
        }

        const triggerDate = new Date(cursor);
        triggerDate.setHours(hour, minute, 0, 0);

        if (triggerDate <= now) {
            continue;
        }

        dates.push(triggerDate);
    }

    return dates;
};

const scheduleReminderForSchedule = async (schedule, settings) => {
    if (!schedule?.id || !schedule?.time_of_day || !schedule?.start_date) {
        return [];
    }

    const triggerDates = buildUpcomingTriggerDates(schedule);
    const ids = [];

    for (const triggerDate of triggerDates) {
        const id = await Notifications.scheduleNotificationAsync({
            content: buildNotificationContent(schedule, settings),
            trigger: triggerDate,
        });
        ids.push(id);
    }

    return ids;
};

export const syncMedicationReminders = async () => {
    if (Platform.OS === 'web') {
        return { scheduled: 0, skipped: true, reason: 'web' };
    }

    let settings = DEFAULT_NOTIFICATION_SETTINGS;
    try {
        const settingsResponse = await getNotificationSettings();
        settings = { ...settings, ...(settingsResponse?.data || {}) };
    } catch (_error) {
        settings = DEFAULT_NOTIFICATION_SETTINGS;
    }

    await ensureNotificationRuntimeConfigured(settings);

    const permissionGranted = await requestNotificationPermission();
    if (!permissionGranted) {
        return { scheduled: 0, skipped: true, reason: 'permission_denied' };
    }

    await cancelStoredMedicationReminders();

    if (!Number(settings.remind_medicine ?? 1)) {
        return { scheduled: 0, skipped: true, reason: 'reminder_disabled' };
    }

    const schedulesResponse = await getSchedules();
    const schedules = Array.isArray(schedulesResponse?.data) ? schedulesResponse.data : [];

    const allIds = [];
    for (const schedule of schedules) {
        const ids = await scheduleReminderForSchedule(schedule, settings);
        allIds.push(...ids);
    }

    await setStoredNotificationIds(allIds);
    return { scheduled: allIds.length, skipped: false };
};

export const requestMedicationNotificationPermission = requestNotificationPermission;

export const scheduleDebugMedicationNotification = async () => {
    if (Platform.OS === 'web') {
        return { skipped: true, reason: 'web' };
    }

    let settings = DEFAULT_NOTIFICATION_SETTINGS;
    try {
        const settingsResponse = await getNotificationSettings();
        settings = { ...settings, ...(settingsResponse?.data || {}) };
    } catch (_error) {
        settings = DEFAULT_NOTIFICATION_SETTINGS;
    }

    const permissionGranted = await requestNotificationPermission();
    if (!permissionGranted) {
        return { skipped: true, reason: 'permission_denied' };
    }

    await ensureNotificationRuntimeConfigured(settings);

    const id = await Notifications.scheduleNotificationAsync({
        content: {
            title: 'Thong bao test',
            body: 'Neu ban thay thong bao nay, local notification dang hoat dong.',
            sound: Number(settings.sound ?? 1) ? true : false,
            ...(Platform.OS === 'android' ? { channelId: REMINDER_CHANNEL_ID } : {}),
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: 10,
        },
    });

    return { skipped: false, id };
};

export const getScheduledMedicationReminderCount = async () => {
    if (Platform.OS === 'web') {
        return 0;
    }

    const requests = await Notifications.getAllScheduledNotificationsAsync();
    return Array.isArray(requests) ? requests.length : 0;
};
