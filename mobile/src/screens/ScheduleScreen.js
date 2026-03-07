import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    RefreshControl, StatusBar, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS, SIZES, SHADOWS } from '../theme/theme';
import { getSchedulesByDate } from '../api/scheduleApi';
import { updateStock } from '../api/medicineApi';
import DaySelector from '../components/DaySelector';
import ScheduleCard, { STATUS } from '../components/ScheduleCard';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ScheduleScreen = ({ navigation }) => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [schedules, setSchedules] = useState([]);
    const [takenMap, setTakenMap] = useState({});
    const [snoozedMap, setSnoozedMap] = useState({});
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        try {
            const res = await getSchedulesByDate(selectedDate).catch(() => ({ data: [] }));
            setSchedules(res.data || []);

            // Load taken status from local storage
            const takenStr = await AsyncStorage.getItem(`taken_${selectedDate}`);
            if (takenStr) setTakenMap(JSON.parse(takenStr));
            else setTakenMap({});
        } catch (error) {
            console.log('Error loading schedules:', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [selectedDate])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const handleTake = async (schedule) => {
        try {
            // Deduct stock
            if (schedule.stock_quantity !== undefined) {
                const newQty = Math.max(0, schedule.stock_quantity - (schedule.dose_amount || 1));
                await updateStock(schedule.medicine_id, newQty).catch(() => { });
            }

            // Mark as taken locally
            const newTakenMap = { ...takenMap, [schedule.id]: true };
            setTakenMap(newTakenMap);
            await AsyncStorage.setItem(`taken_${selectedDate}`, JSON.stringify(newTakenMap));

            // Remove from snoozed if it was snoozed
            const newSnoozedMap = { ...snoozedMap };
            delete newSnoozedMap[schedule.id];
            setSnoozedMap(newSnoozedMap);

            // Reload to get updated stock
            loadData();
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể cập nhật trạng thái uống thuốc');
        }
    };

    const handleSnooze = (schedule) => {
        setSnoozedMap({ ...snoozedMap, [schedule.id]: true });
    };

    const getStatus = (schedule) => {
        if (takenMap[schedule.id]) return STATUS.TAKEN;
        if (snoozedMap[schedule.id]) return STATUS.SNOOZED;
        return STATUS.PENDING;
    };

    const getTimeGroup = (timeStr) => {
        const hour = parseInt(timeStr.split(':')[0]);
        if (hour < 12) return 'MORNING';
        if (hour < 17) return 'AFTERNOON';
        return 'EVENING';
    };

    const groupedSchedules = schedules.reduce((groups, s) => {
        const group = getTimeGroup(s.time_of_day);
        if (!groups[group]) groups[group] = [];
        groups[group].push(s);
        return groups;
    }, {});

    const groupLabels = {
        MORNING: { label: 'MORNING', icon: '🌅' },
        AFTERNOON: { label: 'AFTERNOON', icon: '☀️' },
        EVENING: { label: 'EVENING', icon: '🌙' },
    };

    const groupDotColors = {
        MORNING: COLORS.morningDot,
        AFTERNOON: COLORS.afternoonDot,
        EVENING: COLORS.eveningDot,
    };

    const formatDateHeader = () => {
        const date = new Date(selectedDate);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Schedule</Text>
                        <Text style={styles.dateText}>{formatDateHeader()}</Text>
                    </View>
                    <TouchableOpacity style={styles.calendarBtn}>
                        <Ionicons name="calendar-outline" size={22} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>

                {/* Day Selector */}
                <DaySelector selectedDate={selectedDate} onDateChange={setSelectedDate} />

                {/* Schedules grouped by time of day */}
                {['MORNING', 'AFTERNOON', 'EVENING'].map((group) => {
                    const items = groupedSchedules[group];
                    if (!items || items.length === 0) return null;
                    return (
                        <View key={group} style={styles.timeGroup}>
                            <View style={styles.groupHeader}>
                                <View style={[styles.groupDot, { backgroundColor: groupDotColors[group] }]} />
                                <Text style={styles.groupLabel}>{groupLabels[group].label}</Text>
                            </View>
                            {items.map((schedule) => (
                                <ScheduleCard
                                    key={schedule.id}
                                    schedule={schedule}
                                    status={getStatus(schedule)}
                                    onTake={() => handleTake(schedule)}
                                    onSnooze={() => handleSnooze(schedule)}
                                />
                            ))}
                        </View>
                    );
                })}

                {schedules.length === 0 && !loading && (
                    <View style={styles.emptyState}>
                        <Ionicons name="calendar-outline" size={64} color={COLORS.textMuted} />
                        <Text style={styles.emptyTitle}>Không có lịch uống thuốc</Text>
                        <Text style={styles.emptySubtitle}>Bấm + để thêm lịch uống thuốc mới</Text>
                    </View>
                )}
            </ScrollView>

            {/* FAB */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('AddSchedule')}
                activeOpacity={0.8}
            >
                <Ionicons name="add" size={28} color={COLORS.textWhite} />
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        padding: SIZES.paddingXL,
        paddingBottom: SIZES.tabBarHeight + 80,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SIZES.paddingLG,
    },
    title: {
        fontSize: SIZES.title,
        ...FONTS.bold,
        color: COLORS.primary,
    },
    dateText: {
        fontSize: SIZES.md,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    calendarBtn: {
        width: 44,
        height: 44,
        borderRadius: SIZES.radiusMD,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    timeGroup: {
        marginBottom: SIZES.paddingXL,
    },
    groupHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SIZES.paddingMD,
        gap: 8,
    },
    groupDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    groupLabel: {
        fontSize: SIZES.sm,
        ...FONTS.bold,
        color: COLORS.textSecondary,
        letterSpacing: 1,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        gap: 12,
    },
    emptyTitle: {
        fontSize: SIZES.lg,
        ...FONTS.semibold,
        color: COLORS.textSecondary,
    },
    emptySubtitle: {
        fontSize: SIZES.md,
        color: COLORS.textMuted,
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: SIZES.tabBarHeight + 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.large,
    },
});

export default ScheduleScreen;
