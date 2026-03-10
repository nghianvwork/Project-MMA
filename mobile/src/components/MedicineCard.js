import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../theme/theme';

const MedicineCard = ({ medicine, onPress, onMenuPress, onQuickAdd }) => {
    const getStockStatus = () => {
        if (medicine.stock_quantity === 0) {
            return { label: 'Hết hàng', color: COLORS.danger, icon: 'alert-circle', bgColor: COLORS.dangerLight };
        }
        if (medicine.stock_quantity <= (medicine.low_stock_threshold || 5)) {
            return { label: `Còn lại: ${medicine.stock_quantity} ${medicine.stock_unit || 'viên'}`, color: COLORS.warning, icon: 'warning', bgColor: COLORS.warningLight };
        }
        return { label: `Còn lại: ${medicine.stock_quantity} ${medicine.stock_unit || 'viên'}`, color: COLORS.primary, icon: 'cube-outline', bgColor: COLORS.primaryLight };
    };

    const status = getStockStatus();

    const getMedicineIcon = () => {
        const form = (medicine.form || '').toLowerCase();
        if (form.includes('siro') || form.includes('syrup')) return '🧴';
        if (form.includes('nang mềm') || form.includes('softgel')) return '💊';
        if (form.includes('sủi') || form.includes('effer')) return '🫧';
        if (form.includes('nang') || form.includes('capsule')) return '💊';
        return '💊';
    };

    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.iconContainer}>
                <Text style={styles.medicineEmoji}>{getMedicineIcon()}</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.name} numberOfLines={1}>{medicine.name}</Text>
                    <TouchableOpacity onPress={onMenuPress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name="ellipsis-vertical" size={18} color={COLORS.textMuted} />
                    </TouchableOpacity>
                </View>

                <Text style={styles.dosageForm}>
                    {medicine.dosage && `${medicine.dosage} • `}{medicine.form || 'Chưa xác định'}
                </Text>

                <View style={[styles.stockBadge, { backgroundColor: status.bgColor }]}>
                    <Ionicons name={status.icon} size={14} color={status.color} />
                    <Text style={[styles.stockText, { color: status.color }]}>{status.label}</Text>
                </View>
            </View>

            <TouchableOpacity style={styles.addButton} onPress={onQuickAdd}>
                <Ionicons name="add" size={20} color={COLORS.primary} />
            </TouchableOpacity>
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
    iconContainer: {
        width: 52,
        height: 52,
        borderRadius: SIZES.radiusMD,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SIZES.paddingMD,
    },
    medicineEmoji: {
        fontSize: 26,
    },
    content: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
    },
    name: {
        fontSize: SIZES.lg,
        ...FONTS.bold,
        color: COLORS.text,
        flex: 1,
        marginRight: 8,
    },
    dosageForm: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
        marginBottom: 6,
    },
    stockBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: SIZES.radiusFull,
        gap: 4,
    },
    stockText: {
        fontSize: SIZES.xs,
        ...FONTS.semibold,
    },
    addButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
});

export default MedicineCard;
