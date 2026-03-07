import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONTS, SIZES } from '../theme/theme';

const FilterTabs = ({ tabs, activeTab, onTabChange }) => {
    return (
        <View style={styles.container}>
            {tabs.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                    <TouchableOpacity
                        key={tab.key}
                        style={[styles.tab, isActive && styles.tabActive]}
                        onPress={() => onTabChange(tab.key)}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.dot, { backgroundColor: tab.dotColor }]} />
                        <Text style={[styles.label, isActive && styles.labelActive]}>
                            {tab.label} ({tab.count})
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: SIZES.paddingLG,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: SIZES.radiusFull,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        gap: 6,
    },
    tabActive: {
        backgroundColor: COLORS.primaryLight,
        borderColor: COLORS.primary,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    label: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
        ...FONTS.medium,
    },
    labelActive: {
        color: COLORS.primary,
        ...FONTS.semibold,
    },
});

export default FilterTabs;
