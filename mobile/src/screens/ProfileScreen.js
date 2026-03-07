import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    StatusBar, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS, SIZES, SHADOWS } from '../theme/theme';
import { getProfile } from '../api/userApi';

const ProfileScreen = ({ navigation, route }) => {
    const session = route.params?.session;
    const onLogout = route.params?.onLogout;
    const [profile, setProfile] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const loadProfile = async () => {
        if (!session?.token) return;
        try {
            const res = await getProfile(session.token);
            setProfile(res);
        } catch (error) {
            console.log('Error loading profile:', error);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadProfile();
        }, [session?.token])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await loadProfile();
        setRefreshing(false);
    };

    const handleLogout = () => {
        Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Đăng xuất',
                style: 'destructive',
                onPress: () => onLogout?.(),
            },
        ]);
    };

    const displayName = profile?.display_name || session?.user?.display_name || session?.email || 'Người dùng';
    const displayEmail = profile?.email || session?.user?.email || session?.email || '';

    const menuItems = [
        { icon: 'person-outline', label: 'Thông tin cá nhân', color: COLORS.primary },
        { icon: 'notifications-outline', label: 'Cài đặt thông báo', color: COLORS.warning },
        { icon: 'time-outline', label: 'Lịch sử uống thuốc', color: '#5B9BD5' },
        { icon: 'stats-chart-outline', label: 'Báo cáo', color: '#9B59B6' },
        { icon: 'shield-checkmark-outline', label: 'Quyền riêng tư', color: COLORS.success },
        { icon: 'help-circle-outline', label: 'Trợ giúp', color: COLORS.textSecondary },
        { icon: 'information-circle-outline', label: 'Về ứng dụng', color: COLORS.textSecondary },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Cá nhân</Text>
                </View>

                {/* Avatar Card */}
                <View style={styles.avatarCard}>
                    <View style={styles.avatarCircle}>
                        <Ionicons name="person" size={36} color={COLORS.primary} />
                    </View>
                    <View style={styles.avatarInfo}>
                        <Text style={styles.userName}>{displayName}</Text>
                        <Text style={styles.userId}>{displayEmail}</Text>
                    </View>
                    <TouchableOpacity style={styles.editBtn}>
                        <Ionicons name="create-outline" size={20} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>

                {/* Menu Items */}
                <View style={styles.menuCard}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[styles.menuItem, index < menuItems.length - 1 && styles.menuItemBorder]}
                            activeOpacity={0.6}
                        >
                            <View style={[styles.menuIcon, { backgroundColor: `${item.color}15` }]}>
                                <Ionicons name={item.icon} size={20} color={item.color} />
                            </View>
                            <Text style={styles.menuLabel}>{item.label}</Text>
                            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Logout */}
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
                    <Text style={styles.logoutText}>Đăng xuất</Text>
                </TouchableOpacity>
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
        marginBottom: SIZES.paddingXXL,
    },
    title: {
        fontSize: SIZES.title,
        ...FONTS.bold,
        color: COLORS.text,
    },
    avatarCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.radiusXL,
        padding: SIZES.paddingXL,
        marginBottom: SIZES.paddingXXL,
        ...SHADOWS.small,
    },
    avatarCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SIZES.paddingLG,
    },
    avatarInfo: {
        flex: 1,
    },
    userName: {
        fontSize: SIZES.xl,
        ...FONTS.bold,
        color: COLORS.text,
    },
    userId: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    editBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuCard: {
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.radiusXL,
        ...SHADOWS.small,
        marginBottom: SIZES.paddingXXL,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SIZES.paddingXL,
        paddingVertical: SIZES.paddingLG,
        gap: 12,
    },
    menuItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
    },
    menuIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuLabel: {
        flex: 1,
        fontSize: SIZES.md,
        ...FONTS.medium,
        color: COLORS.text,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.dangerLight,
        borderRadius: SIZES.radiusMD,
        paddingVertical: SIZES.paddingLG,
        gap: 8,
    },
    logoutText: {
        fontSize: SIZES.md,
        ...FONTS.semibold,
        color: COLORS.danger,
    },
});

export default ProfileScreen;
