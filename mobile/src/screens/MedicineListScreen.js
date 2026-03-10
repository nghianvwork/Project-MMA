import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, RefreshControl, StatusBar, Alert, ActionSheetIOS,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS, SIZES, SHADOWS } from '../theme/theme';
import { getMedicines, deleteMedicine } from '../api/medicineApi';
import MedicineCard from '../components/MedicineCard';
import FilterTabs from '../components/FilterTabs';

const MedicineListScreen = ({ navigation }) => {
    const [medicines, setMedicines] = useState([]);
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    const loadMedicines = async () => {
        try {
            const params = {};
            if (search) params.search = search;
            const res = await getMedicines(params).catch(() => ({ data: [] }));
            setMedicines(res.data || []);
        } catch (error) {
            console.log('Error loading medicines:', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadMedicines();
        }, [search])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await loadMedicines();
        setRefreshing(false);
    };

    const filteredMedicines = medicines.filter((med) => {
        if (activeFilter === 'low') return med.stock_quantity > 0 && med.stock_quantity <= (med.low_stock_threshold || 5);
        if (activeFilter === 'out') return med.stock_quantity === 0;
        return true;
    });

    const getFilterCounts = () => {
        const all = medicines.length;
        const low = medicines.filter(m => m.stock_quantity > 0 && m.stock_quantity <= (m.low_stock_threshold || 5)).length;
        const out = medicines.filter(m => m.stock_quantity === 0).length;
        return { all, low, out };
    };

    const counts = getFilterCounts();

    const filterTabs = [
        { key: 'all', label: 'Tất cả', count: counts.all, dotColor: COLORS.primary },
        { key: 'low', label: 'Sắp hết', count: counts.low, dotColor: COLORS.warning },
        { key: 'out', label: 'Hết hàng', count: counts.out, dotColor: COLORS.danger },
    ];

    const handleMenuPress = (medicine) => {
        ActionSheetIOS.showActionSheetWithOptions(
            {
                options: ['Hủy', 'Chỉnh sửa', 'Xóa'],
                destructiveButtonIndex: 2,
                cancelButtonIndex: 0,
                title: medicine.name,
            },
            (buttonIndex) => {
                if (buttonIndex === 1) {
                    navigation.navigate('AddMedicine', { medicine, isEdit: true });
                } else if (buttonIndex === 2) {
                    Alert.alert(
                        'Xóa thuốc',
                        `Bạn có chắc muốn xóa "${medicine.name}"?`,
                        [
                            { text: 'Hủy', style: 'cancel' },
                            {
                                text: 'Xóa',
                                style: 'destructive',
                                onPress: async () => {
                                    try {
                                        await deleteMedicine(medicine.id);
                                        loadMedicines();
                                    } catch (error) {
                                        Alert.alert('Lỗi', error.message || 'Không thể xóa thuốc');
                                    }
                                },
                            },
                        ]
                    );
                }
            }
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.headerBg}>
                    <View style={styles.headerContent}>
                        <View style={styles.headerTopRow}>
                            <View>
                                <Text style={styles.headerTitle}>Kho thuốc</Text>
                                <Text style={styles.headerSubtitle}>Quản lý danh sách thuốc</Text>
                            </View>
                            <View style={styles.headerActions}>
                                <TouchableOpacity style={styles.headerBtn}>
                                    <Ionicons name="moon-outline" size={20} color={COLORS.textWhite} />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.headerBtn}>
                                    <Ionicons name="notifications-outline" size={20} color={COLORS.textWhite} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Action Cards */}
                        <View style={styles.actionCards}>
                            <TouchableOpacity style={[styles.actionCard, styles.actionCardLeft]}>
                                <View style={styles.actionIconCircle}>
                                    <Ionicons name="barcode-outline" size={24} color={COLORS.primary} />
                                </View>
                                <Text style={styles.actionCardText}>Quét mã vạch</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionCard, styles.actionCardRight]}>
                                <View style={[styles.actionIconCircle, { backgroundColor: '#FFF3E0' }]}>
                                    <Ionicons name="document-text-outline" size={24} color={COLORS.warning} />
                                </View>
                                <Text style={styles.actionCardText}>Chụp đơn thuốc</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Body */}
                <View style={styles.body}>
                    {/* Search Bar */}
                    <View style={styles.searchRow}>
                        <View style={styles.searchBar}>
                            <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Tìm kiếm thuốc..."
                                placeholderTextColor={COLORS.textMuted}
                                value={search}
                                onChangeText={setSearch}
                            />
                        </View>
                        <TouchableOpacity style={styles.filterBtn}>
                            <Ionicons name="options-outline" size={20} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Filter Tabs */}
                    <FilterTabs tabs={filterTabs} activeTab={activeFilter} onTabChange={setActiveFilter} />

                    {/* Medicine List */}
                    {filteredMedicines.map((medicine) => (
                        <MedicineCard
                            key={medicine.id}
                            medicine={medicine}
                            onPress={() => navigation.navigate('AddMedicine', { medicine, isEdit: true })}
                            onMenuPress={() => handleMenuPress(medicine)}
                            onQuickAdd={() => navigation.navigate('AddMedicine', { medicine, isEdit: true })}
                        />
                    ))}

                    {filteredMedicines.length === 0 && !loading && (
                        <View style={styles.emptyState}>
                            <Ionicons name="medkit-outline" size={64} color={COLORS.textMuted} />
                            <Text style={styles.emptyTitle}>Chưa có thuốc nào</Text>
                            <Text style={styles.emptySubtitle}>Bấm + để thêm thuốc mới</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* FAB */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('AddMedicine')}
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
        paddingBottom: SIZES.tabBarHeight + 80,
    },
    headerBg: {
        backgroundColor: COLORS.primaryDark,
        paddingBottom: 30,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
    },
    headerContent: {
        paddingHorizontal: SIZES.paddingXL,
        paddingTop: SIZES.paddingLG,
    },
    headerTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SIZES.paddingXL,
    },
    headerTitle: {
        fontSize: SIZES.title,
        ...FONTS.bold,
        color: COLORS.textWhite,
    },
    headerSubtitle: {
        fontSize: SIZES.md,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 2,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 8,
    },
    headerBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionCards: {
        flexDirection: 'row',
        gap: 12,
    },
    actionCard: {
        flex: 1,
        borderRadius: SIZES.radiusLG,
        padding: SIZES.paddingLG,
        alignItems: 'center',
        gap: 8,
    },
    actionCardLeft: {
        backgroundColor: COLORS.primaryLight,
    },
    actionCardRight: {
        backgroundColor: '#FFF8E1',
    },
    actionIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionCardText: {
        fontSize: SIZES.sm,
        ...FONTS.semibold,
        color: COLORS.text,
    },
    body: {
        paddingHorizontal: SIZES.paddingXL,
        paddingTop: SIZES.paddingXL,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: SIZES.paddingLG,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.radiusMD,
        paddingHorizontal: SIZES.paddingMD,
        height: 44,
        gap: 8,
        ...SHADOWS.small,
    },
    searchInput: {
        flex: 1,
        fontSize: SIZES.md,
        color: COLORS.text,
    },
    filterBtn: {
        width: 44,
        height: 44,
        borderRadius: SIZES.radiusMD,
        backgroundColor: COLORS.surface,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.small,
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

export default MedicineListScreen;
