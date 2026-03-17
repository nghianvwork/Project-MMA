import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SHADOWS, SIZES } from '../theme/theme';
import { createMedicine, updateMedicine } from '../api/medicineApi';
import { suggestMedicineByName } from '../services/geminiMedicineLookupService';

const FORM_OPTIONS = [
    'Viên nén',
    'Viên nang',
    'Viên nang mềm',
    'Viên sủi',
    'Siro',
    'Bột',
    'Ống tiêm',
    'Thuốc mỡ',
    'Thuốc nhỏ mắt',
    'Khác',
];

const AddMedicineScreen = ({ navigation, route }) => {
    const existingMedicine = route.params?.medicine;
    const isEdit = route.params?.isEdit || false;
    const scannedMedicine = route.params?.scannedMedicine;
    const scanMeta = route.params?.scanMeta;
    const scannedAt = route.params?.scannedAt;

    const [name, setName] = useState('');
    const [barcode, setBarcode] = useState('');
    const [dosage, setDosage] = useState('');
    const [form, setForm] = useState('');
    const [note, setNote] = useState('');
    const [stockQuantity, setStockQuantity] = useState('0');
    const [stockUnit, setStockUnit] = useState('vien');
    const [lowStockThreshold, setLowStockThreshold] = useState('5');
    const [showFormPicker, setShowFormPicker] = useState(false);
    const [saving, setSaving] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [barcodeLocked, setBarcodeLocked] = useState(false);
    const [scanFeedback, setScanFeedback] = useState('');
    const [scanMatched, setScanMatched] = useState(false);
    const [scanSource, setScanSource] = useState(null);
    const [aiDescription, setAiDescription] = useState('');

    useEffect(() => {
        if (!existingMedicine) {
            return;
        }

        setName(existingMedicine.name || '');
        setBarcode(existingMedicine.barcode || '');
        setDosage(existingMedicine.dosage || '');
        setForm(existingMedicine.form || '');
        setNote(existingMedicine.note || '');
        setStockQuantity(String(existingMedicine.stock_quantity || 0));
        setStockUnit(existingMedicine.stock_unit || 'vien');
        setLowStockThreshold(String(existingMedicine.low_stock_threshold || 5));
        setBarcodeLocked(false);
        setScanFeedback('');
        setScanMatched(false);
        setScanSource(null);
        setAiDescription('');
    }, [existingMedicine]);

    useEffect(() => {
        if (!scannedAt || !scannedMedicine) {
            return;
        }

        if (scannedMedicine.barcode) {
            setBarcode(scannedMedicine.barcode);
            setBarcodeLocked(true);
        }

        if (scannedMedicine.name) {
            setName(scannedMedicine.name);
        }

        if (scannedMedicine.dosage) {
            setDosage(scannedMedicine.dosage);
        }

        if (scannedMedicine.form) {
            setForm(scannedMedicine.form);
        }

        if (scannedMedicine.note) {
            setNote(scannedMedicine.note);
        }

        if (scannedMedicine.description) {
            setAiDescription(scannedMedicine.description);
        }

        const source = scanMeta?.source || null;
        setScanSource(source);
        setScanFeedback(
            scanMeta?.matched
                ? source === 'gemini-image'
                    ? 'AI đã nhận diện thuốc từ ảnh và điền thông tin. Vui lòng kiểm tra trước khi lưu.'
                    : source === 'gemini'
                    ? 'AI đã gợi ý thông tin thuốc. Vui lòng kiểm tra và chỉnh sửa nếu cần.'
                    : 'Đã tìm thấy thông tin thuốc và điền sẵn biểu mẫu.'
                : 'Đã lưu mã vạch. Nhập tên thuốc rồi nhấn "Gợi ý AI" để tự động điền thông tin.',
        );
        setScanMatched(Boolean(scanMeta?.matched));

        navigation.setParams({
            scannedMedicine: undefined,
            scanMeta: undefined,
            scannedAt: undefined,
        });
    }, [navigation, scanMeta?.matched, scannedAt, scannedMedicine]);

    const handleOpenScanner = () => {
        navigation.navigate('BarcodeScanner');
    };

    const handleOpenPhotoLookup = () => {
        navigation.navigate('MedicinePhotoLookup');
    };

    const handleAISuggest = async () => {
        if (!name.trim()) {
            return;
        }

        setAiLoading(true);
        try {
            const result = await suggestMedicineByName(name.trim());
            if (result.name) setName(result.name);
            if (result.dosage) setDosage(result.dosage);
            if (result.form) setForm(result.form);
            if (result.note) setNote(result.note);
            setScanFeedback('AI đã gợi ý thông tin thuốc. Vui lòng kiểm tra và chỉnh sửa nếu cần.');
            setScanMatched(true);
            setScanSource('gemini');
        } catch (error) {
            Alert.alert('Không thể gợi ý', 'AI không phản hồi được lúc này. Vui lòng nhập thủ công.');
        } finally {
            setAiLoading(false);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Lỗi', 'Tên thuốc không được để trống');
            return;
        }

        setSaving(true);

        try {
            const data = {
                name: name.trim(),
                barcode: barcode.trim() || null,
                dosage: dosage.trim() || null,
                form: form || null,
                note: note.trim() || null,
                stock_quantity: parseInt(stockQuantity, 10) || 0,
                stock_unit: stockUnit.trim() || 'vien',
                low_stock_threshold: parseInt(lowStockThreshold, 10) || 5,
            };

            if (isEdit && existingMedicine) {
                await updateMedicine(existingMedicine.id, data);
                Alert.alert('Thành công', 'Cập nhật thuốc thành công', [
                    { text: 'Đóng', onPress: () => navigation.goBack() },
                ]);
            } else {
                await createMedicine(data);
                Alert.alert('Thành công', 'Thêm thuốc thành công', [
                    { text: 'Đóng', onPress: () => navigation.goBack() },
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
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {isEdit ? 'Chỉnh sửa thuốc' : 'Thêm thuốc mới'}
                    </Text>
                    <View style={styles.backBtnPlaceholder} />
                </View>

                <ScrollView
                    contentContainerStyle={styles.form}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.scanCard}>
                        <View style={styles.scanIcon}>
                            <Ionicons name="barcode-outline" size={24} color={COLORS.primaryDark} />
                        </View>
                        <View style={styles.scanTextGroup}>
                            <Text style={styles.scanTitle}>Quét mã vạch thuốc</Text>
                            <Text style={styles.scanSubtitle}>
                                Quét mã vạch, AI sẽ tự động gợi ý thông tin thuốc.
                            </Text>
                        </View>
                        <View style={styles.scanActions}>
                            <TouchableOpacity style={styles.scanButton} onPress={handleOpenScanner}>
                                <Text style={styles.scanButtonText}>{barcode ? 'Quét lại' : 'Quét mã'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.photoButton} onPress={handleOpenPhotoLookup}>
                                <Ionicons name="camera-outline" size={14} color={COLORS.primary} />
                                <Text style={styles.photoButtonText}>Chụp ảnh</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {scanFeedback ? (
                        <View style={styles.feedbackBox}>
                            <Ionicons
                                name={
                                    scanMatched && scanSource === 'gemini'
                                        ? 'bulb'
                                        : scanMatched
                                        ? 'checkmark-circle'
                                        : 'information-circle'
                                }
                                size={18}
                                color={
                                    scanMatched && scanSource === 'gemini'
                                        ? COLORS.primary
                                        : scanMatched
                                        ? COLORS.success
                                        : COLORS.warning
                                }
                            />
                            <Text style={styles.feedbackText}>{scanFeedback}</Text>
                        </View>
                    ) : null}

                    {aiDescription ? (
                        <View style={styles.descriptionBox}>
                            <View style={styles.descriptionHeader}>
                                <Ionicons name="document-text-outline" size={18} color={COLORS.primaryDark} />
                                <Text style={styles.descriptionTitle}>Mô tả thuốc từ AI</Text>
                            </View>
                            <Text style={styles.descriptionText}>{aiDescription}</Text>
                        </View>
                    ) : null}

                    <View style={styles.field}>
                        <View style={styles.fieldHeader}>
                            <Text style={styles.label}>Mã vạch</Text>
                            {barcodeLocked ? (
                                <View style={styles.barcodeBadge}>
                                    <Ionicons name="lock-closed" size={12} color={COLORS.primaryDark} />
                                    <Text style={styles.barcodeBadgeText}>Từ scan</Text>
                                </View>
                            ) : null}
                        </View>
                        <TextInput
                            style={[styles.input, barcodeLocked && styles.inputDisabled]}
                            placeholder="VD: 8934567890123"
                            placeholderTextColor={COLORS.textMuted}
                            value={barcode}
                            onChangeText={setBarcode}
                            editable={!barcodeLocked}
                        />
                    </View>

                    <View style={styles.field}>
                        <View style={styles.fieldHeader}>
                            <Text style={styles.label}>Tên thuốc *</Text>
                            <TouchableOpacity
                                style={[styles.aiButton, (!name.trim() || aiLoading) && styles.aiButtonDisabled]}
                                onPress={handleAISuggest}
                                disabled={!name.trim() || aiLoading}
                                activeOpacity={0.7}
                            >
                                {aiLoading ? (
                                    <ActivityIndicator size="small" color={COLORS.textWhite} />
                                ) : (
                                    <>
                                        <Ionicons name="bulb-outline" size={13} color={COLORS.textWhite} />
                                        <Text style={styles.aiButtonText}>Gợi ý AI</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            style={styles.input}
                            placeholder="VD: Paracetamol"
                            placeholderTextColor={COLORS.textMuted}
                            value={name}
                            onChangeText={setName}
                        />
                    </View>

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

                    <View style={styles.field}>
                        <Text style={styles.label}>Dạng thuốc</Text>
                        <TouchableOpacity
                            style={styles.input}
                            onPress={() => setShowFormPicker((current) => !current)}
                        >
                            <Text style={form ? styles.inputText : styles.placeholderText}>
                                {form || 'Chọn dạng thuốc'}
                            </Text>
                            <Ionicons name="chevron-down" size={18} color={COLORS.textMuted} />
                        </TouchableOpacity>
                        {showFormPicker ? (
                            <View style={styles.pickerDropdown}>
                                {FORM_OPTIONS.map((option) => (
                                    <TouchableOpacity
                                        key={option}
                                        style={[
                                            styles.pickerItem,
                                            form === option && styles.pickerItemActive,
                                        ]}
                                        onPress={() => {
                                            setForm(option);
                                            setShowFormPicker(false);
                                        }}
                                    >
                                        <Text
                                            style={[
                                                styles.pickerItemText,
                                                form === option && styles.pickerItemTextActive,
                                            ]}
                                        >
                                            {option}
                                        </Text>
                                        {form === option ? (
                                            <Ionicons name="checkmark" size={18} color={COLORS.primary} />
                                        ) : null}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ) : null}
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.field, styles.rowFieldLarge]}>
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
                        <View style={[styles.field, styles.rowFieldSmall]}>
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

                    <View style={styles.field}>
                        <Text style={styles.label}>Ghi chú</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="VD: Uống sau ăn 30 phút"
                            placeholderTextColor={COLORS.textMuted}
                            value={note}
                            onChangeText={setNote}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                        onPress={handleSave}
                        disabled={saving}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="checkmark-circle" size={22} color={COLORS.textWhite} />
                        <Text style={styles.saveBtnText}>
                            {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Thêm thuốc'}
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },
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
    backBtnPlaceholder: {
        width: 40,
        height: 40,
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
    scanCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primaryLight,
        borderRadius: SIZES.radiusLG,
        padding: SIZES.paddingLG,
        marginBottom: SIZES.paddingLG,
        gap: 12,
    },
    scanIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanTextGroup: {
        flex: 1,
    },
    scanTitle: {
        fontSize: SIZES.md,
        ...FONTS.bold,
        color: COLORS.text,
        marginBottom: 2,
    },
    scanSubtitle: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
        lineHeight: 18,
    },
    scanButton: {
        borderRadius: SIZES.radiusMD,
        backgroundColor: COLORS.primary,
        paddingHorizontal: SIZES.paddingLG,
        paddingVertical: 10,
    },
    scanActions: {
        gap: 8,
    },
    photoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        borderRadius: SIZES.radiusMD,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.primary,
        paddingHorizontal: SIZES.paddingMD,
        paddingVertical: 8,
    },
    photoButtonText: {
        fontSize: SIZES.xs,
        ...FONTS.semibold,
        color: COLORS.primary,
    },
    scanButtonText: {
        fontSize: SIZES.sm,
        ...FONTS.semibold,
        color: COLORS.textWhite,
    },
    feedbackBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.radiusMD,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: SIZES.paddingLG,
        paddingVertical: SIZES.paddingMD,
        marginBottom: SIZES.paddingXL,
    },
    aiButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: COLORS.primary,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: SIZES.radiusFull,
        minWidth: 80,
        justifyContent: 'center',
    },
    aiButtonDisabled: {
        opacity: 0.45,
    },
    aiButtonText: {
        fontSize: SIZES.xs,
        ...FONTS.semibold,
        color: COLORS.textWhite,
    },
    feedbackText: {
        flex: 1,
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
        lineHeight: 18,
    },
    descriptionBox: {
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.radiusMD,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: SIZES.paddingLG,
        paddingVertical: SIZES.paddingMD,
        marginBottom: SIZES.paddingXL,
    },
    descriptionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    descriptionTitle: {
        fontSize: SIZES.sm,
        ...FONTS.bold,
        color: COLORS.primaryDark,
    },
    descriptionText: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
        lineHeight: 19,
    },
    field: {
        marginBottom: SIZES.paddingXL,
    },
    fieldHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SIZES.paddingSM,
    },
    label: {
        fontSize: SIZES.md,
        ...FONTS.semibold,
        color: COLORS.text,
        marginBottom: SIZES.paddingSM,
    },
    barcodeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.radiusFull,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    barcodeBadgeText: {
        fontSize: SIZES.xs,
        ...FONTS.semibold,
        color: COLORS.primaryDark,
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
    inputDisabled: {
        backgroundColor: COLORS.surfaceSecondary,
        color: COLORS.textSecondary,
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
        minHeight: 88,
        paddingTop: SIZES.paddingMD,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    rowFieldLarge: {
        flex: 2,
    },
    rowFieldSmall: {
        flex: 1,
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
