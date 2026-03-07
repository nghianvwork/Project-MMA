import React, { useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, StatusBar, Animated, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../theme/theme';

const { width, height } = Dimensions.get('window');

const AlarmScreen = ({ navigation, route }) => {
    const schedule = route.params?.schedule || {};
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Fade in
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();

        // Pulse animation for the icon
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.15,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, []);

    const handleTake = () => {
        // TODO: Mark as taken + deduct stock
        navigation.goBack();
    };

    const handleSnooze = () => {
        // TODO: Schedule notification again in 10 minutes
        navigation.goBack();
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                {/* Pulse Ring */}
                <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="medical" size={48} color={COLORS.textWhite} />
                    </View>
                </Animated.View>

                {/* Time */}
                <Text style={styles.timeText}>
                    {new Date().getHours().toString().padStart(2, '0')}:
                    {new Date().getMinutes().toString().padStart(2, '0')}
                </Text>

                {/* Medicine Info */}
                <Text style={styles.label}>Đã đến giờ uống thuốc!</Text>
                <Text style={styles.medicineName}>
                    {schedule.medicine_name || 'Thuốc'}
                </Text>
                <Text style={styles.dosage}>
                    {schedule.dosage || `${schedule.dose_amount || 1} viên`}
                    {schedule.form ? ` • ${schedule.form}` : ''}
                </Text>

                {/* Actions */}
                <View style={styles.actions}>
                    <TouchableOpacity style={styles.takeBtn} onPress={handleTake} activeOpacity={0.8}>
                        <Ionicons name="checkmark-circle" size={28} color={COLORS.textWhite} />
                        <Text style={styles.takeBtnText}>Đã uống</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.snoozeBtn} onPress={handleSnooze} activeOpacity={0.8}>
                        <Ionicons name="alarm-outline" size={24} color={COLORS.textWhite} />
                        <Text style={styles.snoozeBtnText}>Báo lại (10 phút)</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1A1A2E',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    pulseRing: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: 'rgba(46, 125, 111, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    timeText: {
        fontSize: 48,
        ...FONTS.bold,
        color: COLORS.textWhite,
        marginBottom: 12,
    },
    label: {
        fontSize: SIZES.lg,
        color: 'rgba(255,255,255,0.6)',
        marginBottom: 8,
    },
    medicineName: {
        fontSize: SIZES.xxxl,
        ...FONTS.extraBold,
        color: COLORS.textWhite,
        textAlign: 'center',
        marginBottom: 8,
    },
    dosage: {
        fontSize: SIZES.xl,
        color: 'rgba(255,255,255,0.7)',
        marginBottom: 60,
    },
    actions: {
        width: '100%',
        gap: 16,
    },
    takeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        borderRadius: SIZES.radiusLG,
        paddingVertical: 18,
        gap: 10,
    },
    takeBtnText: {
        fontSize: SIZES.xl,
        ...FONTS.bold,
        color: COLORS.textWhite,
    },
    snoozeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: SIZES.radiusLG,
        paddingVertical: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        gap: 10,
    },
    snoozeBtnText: {
        fontSize: SIZES.lg,
        ...FONTS.semibold,
        color: COLORS.textWhite,
    },
});

export default AlarmScreen;
