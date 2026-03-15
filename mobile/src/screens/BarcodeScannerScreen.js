import React, { useMemo, useState } from 'react';
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
import { lookupMedicineByBarcode, sanitizeBarcode } from '../services/barcodeLookupService';

const BARCODE_TYPES = ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'itf14', 'codabar'];

const BarcodeScannerScreen = ({ navigation }) => {
    const [permission, requestPermission] = useCameraPermissions();
    const [torchEnabled, setTorchEnabled] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [lastScannedCode, setLastScannedCode] = useState('');
    const isFocused = useIsFocused();

    const overlayMessage = useMemo(() => {
        if (isProcessing && lastScannedCode) {
            return `Đang xử lý mã ${lastScannedCode}`;
        }

        return 'Căn giữa mã vạch vào khung để quét';
    }, [isProcessing, lastScannedCode]);

    const finishScan = (payload, scanMeta) => {
        navigation.popTo('AddMedicine', {
            scannedMedicine: payload,
            scanMeta,
            scannedAt: Date.now(),
        }, {
            merge: true,
        });
    };

    const handleManualEntry = () => {
        navigation.popTo('AddMedicine');
    };

    const handleScanned = async ({ data, type }) => {
        const barcode = sanitizeBarcode(data);

        if (!barcode || isProcessing) {
            return;
        }

        setIsProcessing(true);
        setLastScannedCode(barcode);

        try {
            const lookupResult = await lookupMedicineByBarcode(barcode);
            const payload = lookupResult.medicine || { barcode };

            finishScan(payload, {
                barcode,
                barcodeType: type,
                matched: Boolean(lookupResult.matched),
                source: lookupResult.source || null,
            });
        } catch (error) {
            Alert.alert(
                'Không thể tra cứu thuốc',
                'Đã quét được mã vạch, nhưng chưa lấy được thông tin thuốc. Bạn vẫn có thể nhập thủ công.',
                [
                    {
                        text: 'Tiếp tục',
                        onPress: () => {
                            finishScan(
                                { barcode },
                                {
                                    barcode,
                                    barcodeType: type,
                                    matched: false,
                                    source: null,
                                },
                            );
                        },
                    },
                ],
            );
        } finally {
            setIsProcessing(false);
        }
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
                        Ứng dụng cần camera để quét mã vạch thuốc và điền sẵn thông tin vào biểu mẫu.
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
            {isFocused && (
                <CameraView
                    style={styles.camera}
                    facing="back"
                    enableTorch={torchEnabled}
                    barcodeScannerSettings={{ barcodeTypes: BARCODE_TYPES }}
                    onBarcodeScanned={isProcessing ? undefined : handleScanned}
                />
            )}

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
                    <Text style={styles.bottomTitle}>Quét mã vạch thuốc</Text>
                    <Text style={styles.bottomText}>{overlayMessage}</Text>
                    {isProcessing && (
                        <View style={styles.loadingRow}>
                            <ActivityIndicator color={COLORS.primary} size="small" />
                            <Text style={styles.loadingText}>Đang tìm thông tin thuốc...</Text>
                        </View>
                    )}
                    <TouchableOpacity
                        style={styles.manualButton}
                        onPress={handleManualEntry}
                    >
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
        height: 170,
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
    manualButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginTop: SIZES.paddingLG,
        backgroundColor: COLORS.primary,
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

export default BarcodeScannerScreen;
