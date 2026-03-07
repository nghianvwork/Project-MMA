import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, StatusBar, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../theme/theme';
import { createMedicine, updateMedicine } from '../api/medicineApi';

const FORM_OPTIONS = [
    'Viên nén', 'Viên nang', 'Viên nang mềm', 'Viên sủi',
    'Siro', 'Bột', 'Ống tiêm', 'Thuốc mỡ', 'Thuốc nhỏ mắt', 'Khác',
];

const AddMedicineScreen = ({ navigation, route }) => {
    const existingMedicine = route.params?.medicine;
    const isEdit = route.params?.isEdit || false;

    const [name, setName] = useState('');
    const [dosage, setDosage] = useState('');
    const [form, setForm] = useState('');
    const [note, setNote] = useState('');
    const [stockQuantity, setStockQuantity] = useState('0');
    const [stockUnit, setStockUnit] = useState('viên');
    const [lowStockThreshold, setLowStockThreshold] = useState('5');
    const [showFormPicker, setShowFormPicker] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (existingMedicine) {
            setName(existingMedicine.name || '');
            setDosage(existingMedicine.dosage || '');
            setForm(existingMedicine.form || '');
            setNote(existingMedicine.note || '');
            setStockQuantity(String(existingMedicine.stock_quantity || 0));
            setStockUnit(existingMedicine.stock_unit || 'viên');
            setLowStockThreshold(String(existingMedicine.low_stock_threshold || 5));
        }
    }, [existingMedicine]);

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Lỗi', 'Tên thuốc không được để trống');
            return;
        }

        setSaving(true);
        try {
            const data = {
                name: name.trim(),
                dosage: dosage.trim() || null,
                form: form || null,
                note: note.trim() || null,
                stock_quantity: parseInt(stockQuantity) || 0,
                stock_unit: stockUnit.trim() || 'viên',
                low_stock_threshold: parseInt(lowStockThreshold) || 5,
            };

            if (isEdit && existingMedicine) {
                await updateMedicine(existingMedicine.id, data);
                Alert.alert('Thành công', 'Cập nhật thuốc thành công', [
                    { text: 'OK', onPress: () => navigation.goBack() },
                ]);
            } else {
                await createMedicine(data);
                Alert.alert('Thành công', 'Thêm thuốc thành công', [
                    { text: 'OK', onPress: () => navigation.goBack() },
                ]);
            }
        } catch (error) {
            Alert.alert('Lỗi', error.message || 'Không thể lưu thuốc');
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
                    <Text style={styles.headerTitle}>{isEdit ? 'Chỉnh sửa thuốc' : 'Thêm thuốc mới'}</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
                    {/* Medicine Name */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Tên thuốc *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="VD: Paracetamol"
                            placeholderTextColor={COLORS.textMuted}
                            value={name}
                            onChangeText={setName}
                        />
                    </View>

                    {/* Dosage */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Liều dùng</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="VD: 500mg"
                            placeholderTextColor={COLORS.textMuted}
                            value={dosage}
                            onChangeText={setDosage}
                        />
                    </View>

                    {/* Form */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Dạng thuốc</Text>
                        <TouchableOpacity
                            style={styles.input}
                            onPress={() => setShowFormPicker(!showFormPicker)}
                        >
                            <Text style={form ? styles.inputText : styles.placeholderText}>
                                {form || 'Chọn dạng thuốc'}
                            </Text>
                            <Ionicons name="chevron-down" size={18} color={COLORS.textMuted} />
                        </TouchableOpacity>
                        {showFormPicker && (
                            <View style={styles.pickerDropdown}>
                                {FORM_OPTIONS.map((option) => (
                                    <TouchableOpacity
                                        key={option}
                                        style={[styles.pickerItem, form === option && styles.pickerItemActive]}
                                        onPress={() => {
                                            setForm(option);
                                            setShowFormPicker(false);
                                        }}
                                    >
                                        <Text style={[styles.pickerItemText, form === option && styles.pickerItemTextActive]}>
                                            {option}
                                        </Text>
                                        {form === option && <Ionicons name="checkmark" size={18} color={COLORS.primary} />}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Stock Quantity & Unit */}
                    <View style={styles.row}>
                        <View style={[styles.field, { flex: 2 }]}>
                            <Text style={styles.label}>Số lượng tồn kho</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="0"
                                placeholderTextColor={COLORS.textMuted}
                                value={stockQuantity}
                                onChangeText={setStockQuantity}
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={[styles.field, { flex: 1 }]}>
                            <Text style={styles.label}>Đơn vị</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="viên"
                                placeholderTextColor={COLORS.textMuted}
                                value={stockUnit}
                                onChangeText={setStockUnit}
                            />
                        </View>
                    </View>

                    {/* Low Stock Threshold */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Ngưỡng cảnh báo hết thuốc</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="5"
                            placeholderTextColor={COLORS.textMuted}
                            value={lowStockThreshold}
                            onChangeText={setLowStockThreshold}
                            keyboardType="numeric"
                        />
                    </View>

                    {/* Note */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Ghi chú</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="VD: Uống sau ăn 30 phút"
                            placeholderTextColor={COLORS.textMuted}
                            value={note}
                            onChangeText={setNote}
                            multiline={true}
                            numberOfLines={3}
                            textAlignVertical="top"
                        />
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
                            {saving ? 'Đang lưu...' : (isEdit ? 'Cập nhật' : 'Thêm thuốc')}
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
    textArea: {
        minHeight: 80,
        paddingTop: SIZES.paddingMD,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
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

export default AddMedicineScreen;
