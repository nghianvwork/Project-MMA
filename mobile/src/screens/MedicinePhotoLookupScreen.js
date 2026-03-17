import React, { useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SHADOWS, SIZES } from '../theme/theme';
import { identifyDrugFromImage } from '../services/geminiService';

const MedicinePhotoLookupScreen = ({ navigation }) => {
    const cameraRef = useRef(null);
    const [permission, requestPermission] = useCameraPermissions();
    const [torchEnabled, setTorchEnabled] = useState(false);
    const [processing, setProcessing] = useState(false);
    const isFocused = useIsFocused();

    const overlayMessage = useMemo(() => {
        if (processing) {
            return 'Đang phân tích ảnh thuốc bằng AI...';
        }

        return 'Đặt hộp/vỉ/chai thuốc vào giữa khung rồi chụp ảnh';
    }, [processing]);

    const finishWithResult = (medicine, scanMeta) => {
        navigation.popTo(
            'AddMedicine',
            {
                scannedMedicine: medicine,
                scanMeta,
                scannedAt: Date.now(),
            },
            {
                merge: true,
            },
        );
    };

    const handleCapture = async () => {
        if (processing || !cameraRef.current) {
            return;
        }

        try {
            setProcessing(true);
            const photo = await cameraRef.current.takePictureAsync({
                base64: true,
                quality: 0.8,
                skipProcessing: true,
            });

            if (!photo?.base64) {
                throw new Error('Không thể lấy dữ liệu ảnh');
            }

            const mimeType = photo?.uri?.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
            const result = await identifyDrugFromImage(photo.base64, mimeType);

            if (!result) {
                Alert.alert(
                    'Không nhận diện được thuốc',
                    'AI chưa xác định được đây là thuốc. Bạn có thể chụp lại hoặc nhập thủ công.',
                );
                return;
            }

            finishWithResult(
                {
                    name: result.name || '',
                    barcode: result.barcode || '',
                    dosage: result.dosage || '',
                    form: result.form || '',
                    note: result.note || '',
                    description: result.description || '',
                },
                {
                    matched: true,
                    source: 'gemini-image',
                },
            );
        } catch (error) {
            Alert.alert(
                'Không thể phân tích ảnh',
                error?.message || 'Đã có lỗi khi gửi ảnh đến AI. Vui lòng thử lại.',
            );
        } finally {
            setProcessing(false);
        }
    };

    const handleManualEntry = () => {
        navigation.popTo('AddMedicine');
    };

    if (!permission) {
        return (
            <SafeAreaView style={styles.permissionScreen}>
                <StatusBar barStyle="light-content" />
                <ActivityIndicator size="large" color={COLORS.textWhite} />
            </SafeAreaView>
        );
    }

    if (!permission.granted) {
        return (
            <SafeAreaView style={styles.permissionScreen}>
                <StatusBar barStyle="light-content" />
                <View style={styles.permissionCard}>
                    <View style={styles.permissionIcon}>
                        <Ionicons name="camera-outline" size={36} color={COLORS.primaryDark} />
                    </View>
                    <Text style={styles.permissionTitle}>Cần quyền sử dụng camera</Text>
                    <Text style={styles.permissionText}>
                        Ứng dụng cần camera để chụp ảnh thuốc và nhờ AI nhận diện thông tin.
                    </Text>
                    <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                        <Text style={styles.permissionButtonText}>Cấp quyền camera</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.permissionSecondaryButton} onPress={() => navigation.goBack()}>
                        <Text style={styles.permissionSecondaryText}>Quay lại</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            {isFocused ? (
                <CameraView
                    ref={cameraRef}
                    style={styles.camera}
                    facing="back"
                    enableTorch={torchEnabled}
                />
            ) : null}

            <SafeAreaView style={styles.overlay} pointerEvents="box-none">
                <View style={styles.topBar}>
                    <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="close" size={24} color={COLORS.textWhite} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => setTorchEnabled((current) => !current)}
                    >
                        <Ionicons
                            name={torchEnabled ? 'flash' : 'flash-off'}
                            size={22}
                            color={COLORS.textWhite}
                        />
                    </TouchableOpacity>
                </View>

                <View style={styles.centerOverlay}>
                    <View style={styles.scanFrame}>
                        <View style={[styles.corner, styles.cornerTopLeft]} />
                        <View style={[styles.corner, styles.cornerTopRight]} />
                        <View style={[styles.corner, styles.cornerBottomLeft]} />
                        <View style={[styles.corner, styles.cornerBottomRight]} />
                    </View>
                </View>

                <View style={styles.bottomSheet}>
                    <Text style={styles.bottomTitle}>Chụp ảnh tìm thuốc</Text>
                    <Text style={styles.bottomText}>{overlayMessage}</Text>

                    {processing ? (
                        <View style={styles.loadingRow}>
                            <ActivityIndicator color={COLORS.primary} size="small" />
                            <Text style={styles.loadingText}>AI đang nhận diện thuốc...</Text>
                        </View>
                    ) : null}

                    <TouchableOpacity
                        style={[styles.captureButton, processing && styles.captureButtonDisabled]}
                        onPress={handleCapture}
                        disabled={processing}
                    >
                        <Ionicons name="camera" size={20} color={COLORS.textWhite} />
                        <Text style={styles.captureButtonText}>Chụp và phân tích</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.manualButton} onPress={handleManualEntry}>
                        <Ionicons name="create-outline" size={18} color={COLORS.textWhite} />
                        <Text style={styles.manualButtonText}>Nhập thủ công</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    camera: {
        flex: 1,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'space-between',
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: SIZES.paddingXL,
        paddingTop: SIZES.paddingSM,
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0, 0, 0, 0.35)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanFrame: {
        width: 270,
        height: 210,
        borderRadius: 24,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.35)',
    },
    corner: {
        position: 'absolute',
        width: 32,
        height: 32,
        borderColor: COLORS.textWhite,
    },
    cornerTopLeft: {
        top: -2,
        left: -2,
        borderTopWidth: 4,
        borderLeftWidth: 4,
        borderTopLeftRadius: 22,
    },
    cornerTopRight: {
        top: -2,
        right: -2,
        borderTopWidth: 4,
        borderRightWidth: 4,
        borderTopRightRadius: 22,
    },
    cornerBottomLeft: {
        bottom: -2,
        left: -2,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
        borderBottomLeftRadius: 22,
    },
    cornerBottomRight: {
        right: -2,
        bottom: -2,
        borderBottomWidth: 4,
        borderRightWidth: 4,
        borderBottomRightRadius: 22,
    },
    bottomSheet: {
        marginHorizontal: SIZES.paddingXL,
        marginBottom: SIZES.paddingXXL,
        borderRadius: SIZES.radiusXL,
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        padding: SIZES.paddingXL,
        ...SHADOWS.large,
    },
    bottomTitle: {
        fontSize: SIZES.xl,
        ...FONTS.bold,
        color: COLORS.text,
        marginBottom: 6,
    },
    bottomText: {
        fontSize: SIZES.md,
        color: COLORS.textSecondary,
        lineHeight: 20,
    },
    loadingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: SIZES.paddingLG,
    },
    loadingText: {
        fontSize: SIZES.sm,
        color: COLORS.primaryDark,
        ...FONTS.semibold,
    },
    captureButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginTop: SIZES.paddingLG,
        backgroundColor: COLORS.primary,
        borderRadius: SIZES.radiusMD,
        paddingVertical: SIZES.paddingMD,
    },
    captureButtonDisabled: {
        opacity: 0.6,
    },
    captureButtonText: {
        fontSize: SIZES.md,
        ...FONTS.semibold,
        color: COLORS.textWhite,
    },
    manualButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginTop: SIZES.paddingMD,
        backgroundColor: COLORS.primaryDark,
        borderRadius: SIZES.radiusMD,
        paddingVertical: SIZES.paddingMD,
    },
    manualButtonText: {
        fontSize: SIZES.md,
        ...FONTS.semibold,
        color: COLORS.textWhite,
    },
    permissionScreen: {
        flex: 1,
        backgroundColor: COLORS.primaryDark,
        justifyContent: 'center',
        paddingHorizontal: SIZES.paddingXL,
    },
    permissionCard: {
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.radiusXL,
        padding: SIZES.paddingXXL,
        alignItems: 'center',
        ...SHADOWS.large,
    },
    permissionIcon: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.primaryLight,
        marginBottom: SIZES.paddingLG,
    },
    permissionTitle: {
        fontSize: SIZES.xxl,
        ...FONTS.bold,
        color: COLORS.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    permissionText: {
        fontSize: SIZES.md,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: SIZES.paddingXL,
    },
    permissionButton: {
        width: '100%',
        borderRadius: SIZES.radiusMD,
        backgroundColor: COLORS.primary,
        paddingVertical: SIZES.paddingMD,
        alignItems: 'center',
    },
    permissionButtonText: {
        fontSize: SIZES.md,
        ...FONTS.semibold,
        color: COLORS.textWhite,
    },
    permissionSecondaryButton: {
        marginTop: SIZES.paddingMD,
        paddingVertical: SIZES.paddingSM,
    },
    permissionSecondaryText: {
        fontSize: SIZES.md,
        color: COLORS.textSecondary,
    },
});

export default MedicinePhotoLookupScreen;