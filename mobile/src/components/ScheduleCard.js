import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../theme/theme';

const STATUS = {
    TAKEN: 'taken',
    SNOOZED: 'snoozed',
    PENDING: 'pending',
    MISSED: 'missed',
};

const ScheduleCard = ({ schedule, status = STATUS.PENDING, onTake, onSnooze, onPress }) => {
    const isTaken = status === STATUS.TAKEN;
    const isSnoozed = status === STATUS.SNOOZED;

    const getMedicineColor = () => {
        const colors = ['#5B9BD5', '#FF8C42', '#9B59B6', '#E74C3C', '#2ECC71', '#F39C12'];
        const index = (schedule.medicine_id || 0) % colors.length;
        return colors[index];
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return '';
        const parts = timeStr.split(':');
        const hour = parseInt(parts[0]);
        const min = parts[1];
        const ampm = hour >= 12 ? 'CH' : 'SA';
        const h = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        return `${h.toString().padStart(2, '0')}:${min} ${ampm}`;
    };

    const getRuleLabel = () => {
        if (schedule.rule_type === 'daily') return null;
        if (schedule.rule_type === 'every_x_days') return `Mỗi ${schedule.interval_days} ngày`;
        if (schedule.rule_type === 'weekdays') return 'Theo ngày trong tuần';
        return null;
    };

    const ruleLabel = getRuleLabel();

    return (
        <TouchableOpacity
            style={[
                styles.card,
                isTaken && styles.cardTaken,
            ]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.leftSection}>
                <View style={[styles.iconCircle, { backgroundColor: isTaken ? '#E0E0E0' : getMedicineColor() }]}>
                    <Ionicons
                        name={isTaken ? 'checkmark' : 'medical'}
                        size={18}
                        color="#FFFFFF"
                    />
                </View>
            </View>

            <View style={styles.content}>
                <View style={styles.nameRow}>
                    <Text style={[styles.name, isTaken && styles.nameTaken]} numberOfLines={1}>
                        {schedule.medicine_name || 'Thuốc'}
                    </Text>
                    {isSnoozed && (
                        <View style={styles.snoozedBadge}>
                            <Text style={styles.snoozedText}>ĐÃ HOÃN</Text>
                        </View>
                    )}
                </View>

                <Text style={[styles.detail, isTaken && styles.detailTaken]}>
                    {formatTime(schedule.time_of_day)} • {schedule.dosage || `${schedule.dose_amount || 1} viên`}
                    {schedule.note ? ` • ${schedule.note}` : ''}
                </Text>

                {isSnoozed && (
                    <View style={styles.actionsRow}>
                        <TouchableOpacity onPress={onTake}>
                            <Text style={styles.takeNowText}>Uống ngay</Text>
                        </TouchableOpacity>
                        <Text style={styles.remindText}>  Nhắc lại sau 15 phút</Text>
                    </View>
                )}

                {ruleLabel && !isTaken && (
                    <View style={styles.ruleBadge}>
                        <Text style={styles.ruleText}>{ruleLabel}</Text>
                    </View>
                )}
            </View>

            <View style={styles.rightSection}>
                {isTaken ? (
                    <View style={styles.checkCircle}>
                        <Ionicons name="checkmark" size={18} color={COLORS.primary} />
                    </View>
                ) : (
                    <TouchableOpacity style={styles.checkCircleOutline} onPress={onTake}>
                        <Ionicons name="checkmark" size={18} color={COLORS.textMuted} />
                    </TouchableOpacity>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.radiusLG,
        padding: SIZES.cardPadding,
        marginBottom: SIZES.paddingSM,
        ...SHADOWS.small,
    },
    cardTaken: {
        opacity: 0.6,
    },
    leftSection: {
        marginRight: SIZES.paddingMD,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    name: {
        fontSize: SIZES.lg,
        ...FONTS.semibold,
        color: COLORS.text,
    },
    nameTaken: {
        color: COLORS.textMuted,
        textDecorationLine: 'line-through',
    },
    detail: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    detailTaken: {
        color: COLORS.textMuted,
    },
    snoozedBadge: {
        backgroundColor: COLORS.dangerLight,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: SIZES.radiusFull,
    },
    snoozedText: {
        fontSize: SIZES.xs,
        color: COLORS.snoozed,
        ...FONTS.bold,
    },
    actionsRow: {
        flexDirection: 'row',
        marginTop: 6,
        alignItems: 'center',
    },
    takeNowText: {
        fontSize: SIZES.sm,
        color: COLORS.primary,
        ...FONTS.semibold,
        textDecorationLine: 'underline',
    },
    remindText: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
    },
    ruleBadge: {
        backgroundColor: COLORS.primaryLight,
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: SIZES.radiusFull,
        marginTop: 6,
    },
    ruleText: {
        fontSize: SIZES.xs,
        color: COLORS.primary,
        ...FONTS.medium,
    },
    rightSection: {
        marginLeft: 8,
    },
    checkCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkCircleOutline: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export { STATUS };
export default ScheduleCard;
