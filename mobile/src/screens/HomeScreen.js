import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    RefreshControl, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS, SIZES, SHADOWS } from '../theme/theme';
import { getSchedulesByDate } from '../api/scheduleApi';
import { getLowStockMedicines } from '../api/medicineApi';
import { toVietnamDateString } from '../utils/dateTime';

const HomeScreen = ({ navigation }) => {
    const [todaySchedules, setTodaySchedules] = useState([]);
    const [lowStockMeds, setLowStockMeds] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    const today = toVietnamDateString();

    const loadData = async () => {
        try {
            const [schedRes, stockRes] = await Promise.all([
                getSchedulesByDate(today).catch(() => ({ data: [] })),
                getLowStockMedicines().catch(() => ({ data: [] })),
            ]);
            setTodaySchedules(schedRes.data || []);
            setLowStockMeds(stockRes.data || []);
        } catch (error) {
            console.log('Error loading home data:', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Chào buổi sáng! ☀️';
        if (hour < 18) return 'Chào buổi chiều! 🌤️';
        return 'Chào buổi tối! 🌙';
    };

    const getNextMedicine = () => {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        return todaySchedules.find(s => s.time_of_day > currentTime);
    };

    const nextMed = getNextMedicine();

    const formatTime = (timeStr) => {
        if (!timeStr) return '';
        const parts = timeStr.split(':');
        const hour = parseInt(parts[0]);
        const min = parts[1];
        return `${hour.toString().padStart(2, '0')}:${min}`;
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
                        <Text style={styles.greeting}>{getGreeting()}</Text>
                        <Text style={styles.subtitle}>Theo dõi sức khỏe của bạn</Text>
                    </View>
                    <TouchableOpacity style={styles.notifBtn}>
                        <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
                        {lowStockMeds.length > 0 && <View style={styles.notifDot} />}
                    </TouchableOpacity>
                </View>

                {/* Today Summary Card */}
                <View style={styles.summaryCard}>
                    <View style={styles.summaryHeader}>
                        <Text style={styles.summaryTitle}>Hôm nay</Text>
                        <Text style={styles.summaryDate}>
                            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </Text>
                    </View>
                    <View style={styles.summaryStats}>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{todaySchedules.length}</Text>
                            <Text style={styles.statLabel}>Thuốc cần uống</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>0</Text>
                            <Text style={styles.statLabel}>Đã uống</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={[styles.statNumber, { color: COLORS.warning }]}>{lowStockMeds.length}</Text>
                            <Text style={styles.statLabel}>Sắp hết</Text>
                        </View>
                    </View>
                </View>

                {/* Next Medicine */}
                {nextMed && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Thuốc tiếp theo</Text>
                        <TouchableOpacity style={styles.nextMedCard}>
                            <View style={styles.nextMedIcon}>
                                <Ionicons name="alarm-outline" size={28} color={COLORS.primary} />
                            </View>
                            <View style={styles.nextMedContent}>
                                <Text style={styles.nextMedName}>{nextMed.medicine_name}</Text>
                                <Text style={styles.nextMedDetail}>
                                    {formatTime(nextMed.time_of_day)} • {nextMed.dosage || `${nextMed.dose_amount || 1} viên`}
                                </Text>
                            </View>
                            <View style={styles.nextMedTime}>
                                <Text style={styles.nextMedTimeText}>{formatTime(nextMed.time_of_day)}</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
                    <View style={styles.quickActions}>
                        <TouchableOpacity
                            style={[styles.actionCard, { backgroundColor: '#E8F5F1' }]}
                            onPress={() => navigation.navigate('ScheduleTab')}
                        >
                            <Ionicons name="calendar-outline" size={28} color={COLORS.primary} />
                            <Text style={styles.actionLabel}>Lịch uống thuốc</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionCard, { backgroundColor: '#FFF3E0' }]}
                            onPress={() => navigation.navigate('MedicineTab')}
                        >
                            <Ionicons name="medkit-outline" size={28} color={COLORS.warning} />
                            <Text style={styles.actionLabel}>Kho thuốc</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Low Stock Warnings */}
                {lowStockMeds.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>⚠️ Thuốc sắp hết</Text>
                        {lowStockMeds.slice(0, 3).map((med) => (
                            <View key={med.id} style={styles.warningCard}>
                                <Ionicons name="warning" size={18} color={COLORS.warning} />
                                <View style={styles.warningContent}>
                                    <Text style={styles.warningName}>{med.name}</Text>
                                    <Text style={styles.warningStock}>
                                        Còn {med.stock_quantity} {med.stock_unit || 'viên'}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
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
        paddingBottom: SIZES.tabBarHeight + 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SIZES.paddingXXL,
    },
    greeting: {
        fontSize: SIZES.xxxl,
        ...FONTS.bold,
        color: COLORS.text,
    },
    subtitle: {
        fontSize: SIZES.md,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    notifBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.surface,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.small,
    },
    notifDot: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.danger,
    },
    summaryCard: {
        backgroundColor: COLORS.primary,
        borderRadius: SIZES.radiusXL,
        padding: SIZES.paddingXL,
        marginBottom: SIZES.paddingXXL,
        ...SHADOWS.medium,
    },
    summaryHeader: {
        marginBottom: SIZES.paddingLG,
    },
    summaryTitle: {
        fontSize: SIZES.xl,
        ...FONTS.bold,
        color: COLORS.textWhite,
    },
    summaryDate: {
        fontSize: SIZES.sm,
        color: 'rgba(255,255,255,0.75)',
        marginTop: 2,
    },
    summaryStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: SIZES.radiusMD,
        paddingVertical: SIZES.paddingMD,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statNumber: {
        fontSize: SIZES.xxl,
        ...FONTS.extraBold,
        color: COLORS.textWhite,
    },
    statLabel: {
        fontSize: SIZES.xs,
        color: 'rgba(255,255,255,0.75)',
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    section: {
        marginBottom: SIZES.paddingXXL,
    },
    sectionTitle: {
        fontSize: SIZES.lg,
        ...FONTS.bold,
        color: COLORS.text,
        marginBottom: SIZES.paddingMD,
    },
    nextMedCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.radiusLG,
        padding: SIZES.cardPadding,
        ...SHADOWS.small,
    },
    nextMedIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SIZES.paddingMD,
    },
    nextMedContent: {
        flex: 1,
    },
    nextMedName: {
        fontSize: SIZES.lg,
        ...FONTS.semibold,
        color: COLORS.text,
    },
    nextMedDetail: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    nextMedTime: {
        backgroundColor: COLORS.primaryLight,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: SIZES.radiusFull,
    },
    nextMedTimeText: {
        fontSize: SIZES.sm,
        ...FONTS.bold,
        color: COLORS.primary,
    },
    quickActions: {
        flexDirection: 'row',
        gap: 12,
    },
    actionCard: {
        flex: 1,
        borderRadius: SIZES.radiusLG,
        padding: SIZES.paddingLG,
        alignItems: 'center',
        gap: 8,
        ...SHADOWS.small,
    },
    actionLabel: {
        fontSize: SIZES.sm,
        ...FONTS.semibold,
        color: COLORS.text,
        textAlign: 'center',
    },
    warningCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.warningLight,
        borderRadius: SIZES.radiusMD,
        padding: SIZES.paddingMD,
        marginBottom: 8,
        gap: 10,
    },
    warningContent: {
        flex: 1,
    },
    warningName: {
        fontSize: SIZES.md,
        ...FONTS.semibold,
        color: COLORS.text,
    },
    warningStock: {
        fontSize: SIZES.sm,
        color: COLORS.warning,
        marginTop: 1,
    },
});

export default HomeScreen;
