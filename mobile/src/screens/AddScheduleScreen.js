import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, StatusBar, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS, SIZES, SHADOWS } from '../theme/theme';
import { createSchedule } from '../api/scheduleApi';
import { getMedicines } from '../api/medicineApi';

const RULE_TYPES = [
    { key: 'daily', label: 'Hàng ngày', icon: 'calendar', desc: 'Uống mỗi ngày' },
    { key: 'every_x_days', label: 'Cách ngày', icon: 'swap-horizontal', desc: 'Uống mỗi X ngày' },
    { key: 'weekdays', label: 'Theo thứ', icon: 'grid', desc: 'Chọn ngày trong tuần' },
];

const WEEKDAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const AddScheduleScreen = ({ navigation, route }) => {
    const [medicines, setMedicines] = useState([]);
    const [selectedMedicine, setSelectedMedicine] = useState(null);
    const [showMedicinePicker, setShowMedicinePicker] = useState(false);
    const [ruleType, setRuleType] = useState('daily');
    const [intervalDays, setIntervalDays] = useState('2');
    const [selectedWeekdays, setSelectedWeekdays] = useState([1, 3, 5]); // Mon, Wed, Fri
    const [timeOfDay, setTimeOfDay] = useState('08:00');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState('');
    const [doseAmount, setDoseAmount] = useState('1');
    const [saving, setSaving] = useState(false);

    useFocusEffect(
        useCallback(() => {
            loadMedicines();
        }, [])
    );

    const loadMedicines = async () => {
        try {
            const res = await getMedicines().catch(() => ({ data: [] }));
            setMedicines(res.data || []);
        } catch (error) {
            console.log('Error loading medicines:', error);
        }
    };

    const toggleWeekday = (day) => {
        setSelectedWeekdays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
        );
    };

    const handleSave = async () => {
        if (!selectedMedicine) {
            Alert.alert('Lỗi', 'Vui lòng chọn thuốc');
            return;
        }
        if (!timeOfDay) {
            Alert.alert('Lỗi', 'Vui lòng nhập giờ uống');
            return;
        }
        if (ruleType === 'weekdays' && selectedWeekdays.length === 0) {
            Alert.alert('Lỗi', 'Vui lòng chọn ít nhất 1 ngày trong tuần');
            return;
        }

        setSaving(true);
        try {
            const data = {
                medicine_id: selectedMedicine.id,
                start_date: startDate,
                end_date: endDate || null,
                time_of_day: `${timeOfDay}:00`,
                rule_type: ruleType,
                dose_amount: parseInt(doseAmount) || 1,
            };

            if (ruleType === 'every_x_days') {
                data.interval_days = parseInt(intervalDays) || 2;
            }
            if (ruleType === 'weekdays') {
                data.weekdays = selectedWeekdays.join(',');
            }

            await createSchedule(data);
            Alert.alert('Thành công', 'Tạo lịch uống thuốc thành công', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        } catch (error) {
            Alert.alert('Lỗi', error.message || 'Không thể tạo lịch');
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Thêm lịch uống</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
                    {/* Select Medicine */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Chọn thuốc *</Text>
                        <TouchableOpacity
                            style={styles.input}
                            onPress={() => setShowMedicinePicker(!showMedicinePicker)}
                        >
                            <Text style={selectedMedicine ? styles.inputText : styles.placeholderText}>
                                {selectedMedicine ? selectedMedicine.name : 'Chọn thuốc'}
                            </Text>
                            <Ionicons name="chevron-down" size={18} color={COLORS.textMuted} />
                        </TouchableOpacity>
                        {showMedicinePicker && (
                            <View style={styles.pickerDropdown}>
                                <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled={true}>
                                    {medicines.map((med) => (
                                        <TouchableOpacity
                                            key={med.id}
                                            style={[styles.pickerItem, selectedMedicine?.id === med.id && styles.pickerItemActive]}
                                            onPress={() => {
                                                setSelectedMedicine(med);
                                                setShowMedicinePicker(false);
                                            }}
                                        >
                                            <View>
                                                <Text style={[styles.pickerItemText, selectedMedicine?.id === med.id && styles.pickerItemTextActive]}>
                                                    {med.name}
                                                </Text>
                                                <Text style={styles.pickerItemSub}>{med.dosage} • {med.form}</Text>
                                            </View>
                                            {selectedMedicine?.id === med.id && <Ionicons name="checkmark" size={18} color={COLORS.primary} />}
                                        </TouchableOpacity>
                                    ))}
                                    {medicines.length === 0 && (
                                        <View style={styles.pickerEmpty}>
                                            <Text style={styles.pickerEmptyText}>Chưa có thuốc. Thêm thuốc trước.</Text>
                                        </View>
                                    )}
                                </ScrollView>
                            </View>
                        )}
                    </View>

                    {/* Rule Type */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Kiểu lịch</Text>
                        <View style={styles.ruleCards}>
                            {RULE_TYPES.map((rule) => (
                                <TouchableOpacity
                                    key={rule.key}
                                    style={[styles.ruleCard, ruleType === rule.key && styles.ruleCardActive]}
                                    onPress={() => setRuleType(rule.key)}
                                >
                                    <Ionicons
                                        name={rule.icon}
                                        size={22}
                                        color={ruleType === rule.key ? COLORS.primary : COLORS.textMuted}
                                    />
                                    <Text style={[styles.ruleLabel, ruleType === rule.key && styles.ruleLabelActive]}>
                                        {rule.label}
                                    </Text>
                                    <Text style={styles.ruleDesc}>{rule.desc}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Interval Days (for every_x_days) */}
                    {ruleType === 'every_x_days' && (
                        <View style={styles.field}>
                            <Text style={styles.label}>Mỗi bao nhiêu ngày?</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="2"
                                placeholderTextColor={COLORS.textMuted}
                                value={intervalDays}
                                onChangeText={setIntervalDays}
                                keyboardType="numeric"
                            />
                        </View>
                    )}

                    {/* Weekdays (for weekdays) */}
                    {ruleType === 'weekdays' && (
                        <View style={styles.field}>
                            <Text style={styles.label}>Chọn ngày trong tuần</Text>
                            <View style={styles.weekdayRow}>
                                {WEEKDAY_LABELS.map((label, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={[styles.weekdayBtn, selectedWeekdays.includes(index) && styles.weekdayBtnActive]}
                                        onPress={() => toggleWeekday(index)}
                                    >
                                        <Text style={[styles.weekdayText, selectedWeekdays.includes(index) && styles.weekdayTextActive]}>
                                            {label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Time */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Giờ uống *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="08:00"
                            placeholderTextColor={COLORS.textMuted}
                            value={timeOfDay}
                            onChangeText={setTimeOfDay}
                        />
                    </View>

                    {/* Dose Amount */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Số lượng mỗi lần</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="1"
                            placeholderTextColor={COLORS.textMuted}
                            value={doseAmount}
                            onChangeText={setDoseAmount}
                            keyboardType="numeric"
                        />
                    </View>

                    {/* Start Date */}
                    <View style={styles.row}>
                        <View style={[styles.field, { flex: 1 }]}>
                            <Text style={styles.label}>Ngày bắt đầu</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor={COLORS.textMuted}
                                value={startDate}
                                onChangeText={setStartDate}
                            />
                        </View>
                        <View style={[styles.field, { flex: 1 }]}>
                            <Text style={styles.label}>Ngày kết thúc</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Không giới hạn"
                                placeholderTextColor={COLORS.textMuted}
                                value={endDate}
                                onChangeText={setEndDate}
                            />
                        </View>
                    </View>

                    {/* Save Button */}
                    <TouchableOpacity
                        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                        onPress={handleSave}
                        disabled={saving}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="checkmark-circle" size={22} color={COLORS.textWhite} />
                        <Text style={styles.saveBtnText}>
                            {saving ? 'Đang lưu...' : 'Tạo lịch'}
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SIZES.paddingLG,
        paddingVertical: SIZES.paddingMD,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: SIZES.xl,
        ...FONTS.bold,
        color: COLORS.text,
    },
    form: {
        padding: SIZES.paddingXL,
        paddingBottom: 40,
    },
    field: {
        marginBottom: SIZES.paddingXL,
    },
    label: {
        fontSize: SIZES.md,
        ...FONTS.semibold,
        color: COLORS.text,
        marginBottom: SIZES.paddingSM,
    },
    input: {
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.radiusMD,
        paddingHorizontal: SIZES.paddingLG,
        paddingVertical: SIZES.paddingMD,
        fontSize: SIZES.md,
        color: COLORS.text,
        borderWidth: 1,
        borderColor: COLORS.border,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 48,
    },
    inputText: {
        fontSize: SIZES.md,
        color: COLORS.text,
    },
    placeholderText: {
        fontSize: SIZES.md,
        color: COLORS.textMuted,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    ruleCards: {
        flexDirection: 'row',
        gap: 10,
    },
    ruleCard: {
        flex: 1,
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.radiusMD,
        padding: SIZES.paddingMD,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: COLORS.border,
        gap: 4,
    },
    ruleCardActive: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primaryLight,
    },
    ruleLabel: {
        fontSize: SIZES.sm,
        ...FONTS.semibold,
        color: COLORS.textSecondary,
    },
    ruleLabelActive: {
        color: COLORS.primary,
    },
    ruleDesc: {
        fontSize: SIZES.xs,
        color: COLORS.textMuted,
        textAlign: 'center',
    },
    weekdayRow: {
        flexDirection: 'row',
        gap: 8,
    },
    weekdayBtn: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: SIZES.paddingMD,
        borderRadius: SIZES.radiusMD,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    weekdayBtnActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    weekdayText: {
        fontSize: SIZES.sm,
        ...FONTS.semibold,
        color: COLORS.textSecondary,
    },
    weekdayTextActive: {
        color: COLORS.textWhite,
    },
    pickerDropdown: {
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.radiusMD,
        marginTop: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...SHADOWS.medium,
    },
    pickerItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SIZES.paddingLG,
        paddingVertical: SIZES.paddingMD,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
    },
    pickerItemActive: {
        backgroundColor: COLORS.primaryLight,
    },
    pickerItemText: {
        fontSize: SIZES.md,
        color: COLORS.text,
    },
    pickerItemTextActive: {
        color: COLORS.primary,
        ...FONTS.semibold,
    },
    pickerItemSub: {
        fontSize: SIZES.xs,
        color: COLORS.textMuted,
        marginTop: 1,
    },
    pickerEmpty: {
        padding: SIZES.paddingXL,
        alignItems: 'center',
    },
    pickerEmptyText: {
        fontSize: SIZES.md,
        color: COLORS.textMuted,
    },
    saveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        borderRadius: SIZES.radiusMD,
        paddingVertical: SIZES.paddingLG,
        gap: 8,
        marginTop: SIZES.paddingLG,
        ...SHADOWS.medium,
    },
    saveBtnDisabled: {
        opacity: 0.6,
    },
    saveBtnText: {
        fontSize: SIZES.lg,
        ...FONTS.bold,
        color: COLORS.textWhite,
    },
});

export default AddScheduleScreen;
