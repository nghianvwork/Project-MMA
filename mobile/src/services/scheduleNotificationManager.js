import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSchedules } from '../api/scheduleApi';
import {
    scheduleLocalNotification,
    cancelAllNotifications,
    cancelNotification,
} from './notificationService';

const NOTIFICATION_MAP_KEY = 'scheduled_notification_ids';
const DAYS_TO_SCHEDULE = 7;

/**
 * Get stored notification identifier map { "scheduleId_date_time": notificationIdentifier }
 */
async function getNotificationMap() {
    try {
        const stored = await AsyncStorage.getItem(NOTIFICATION_MAP_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch {
        return {};
    }
}

async function saveNotificationMap(map) {
    try {
        await AsyncStorage.setItem(NOTIFICATION_MAP_KEY, JSON.stringify(map));
    } catch { }
}

/**
 * Check if a schedule should fire on a specific date given its rule_type.
 */
function shouldScheduleFireOnDate(schedule, date) {
    const startDate = new Date(schedule.start_date);
    startDate.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    if (checkDate < startDate) return false;
    if (schedule.end_date) {
        const endDate = new Date(schedule.end_date);
        endDate.setHours(0, 0, 0, 0);
        if (checkDate > endDate) return false;
    }

    if (schedule.rule_type === 'daily') return true;

    if (schedule.rule_type === 'every_x_days') {
        const diffDays = Math.floor((checkDate - startDate) / (1000 * 60 * 60 * 24));
        return diffDays % (schedule.interval_days || 1) === 0;
    }

    if (schedule.rule_type === 'weekdays') {
        const weekdays = (schedule.weekdays || '').split(',').map(Number);
        return weekdays.includes(checkDate.getDay());
    }

    return false;
}

/**
 * Sync all schedule notifications for the next N days.
 * Cancels all currently scheduled local notifications and re-schedules.
 */
export async function syncScheduleNotifications() {
    try {
        console.log('[NotifManager] Syncing schedule notifications...');

        // Cancel all existing scheduled notifications
        await cancelAllNotifications();
        const newMap = {};

        const now = new Date();
        let allSchedules = [];

        try {
            const response = await getSchedules();
            if (Array.isArray(response?.data)) {
                allSchedules = response.data;
            } else if (Array.isArray(response)) {
                allSchedules = response;
            }
        } catch (error) {
            console.log('[NotifManager] Failed to fetch schedules:', error?.message || error);
            return 0;
        }

        for (let dayOffset = 0; dayOffset < DAYS_TO_SCHEDULE; dayOffset++) {
            const targetDate = new Date(now);
            targetDate.setDate(now.getDate() + dayOffset);
            const dateStr = targetDate.toISOString().split('T')[0];

            for (const schedule of allSchedules) {
                if (!shouldScheduleFireOnDate(schedule, targetDate)) continue;

                // Parse time_of_day (HH:MM:SS or HH:MM)
                const timeParts = (schedule.time_of_day || '08:00:00').split(':');
                const triggerDate = new Date(targetDate);
                triggerDate.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]), 0, 0);

                // Skip if the trigger time is in the past
                if (triggerDate <= now) continue;

                const mapKey = `${schedule.id}_${dateStr}_${schedule.time_of_day}`;

                try {
                    const identifier = await scheduleLocalNotification({
                        scheduleId: schedule.id,
                        medicineId: schedule.medicine_id,
                        medicineName: schedule.medicine_name,
                        dosage: schedule.dosage,
                        doseAmount: schedule.dose_amount,
                        form: schedule.form,
                        triggerDate,
                    });

                    newMap[mapKey] = identifier;
                } catch (err) {
                    console.log('[NotifManager] Failed to schedule:', mapKey, err.message);
                }
            }
        }

        await saveNotificationMap(newMap);
        const count = Object.keys(newMap).length;
        console.log(`[NotifManager] Scheduled ${count} notifications for next ${DAYS_TO_SCHEDULE} days`);
        return count;
    } catch (error) {
        console.error('[NotifManager] Error syncing notifications:', error);
        return 0;
    }
}

/**
 * Cancel a specific schedule's notification for today.
 */
export async function cancelScheduleNotification(scheduleId) {
    const map = await getNotificationMap();
    const today = new Date().toISOString().split('T')[0];

    for (const [key, identifier] of Object.entries(map)) {
        if (key.startsWith(`${scheduleId}_${today}`)) {
            try {
                await cancelNotification(identifier);
                delete map[key];
            } catch { }
        }
    }

    await saveNotificationMap(map);
}
