import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../theme/theme';

<<<<<<< Updated upstream
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
=======
const DAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const parseSelectedDate = (value) => {
  const parsed = parseVietnamSqlDateTime(value);
  if (parsed) {
    return new Date(parsed.year, parsed.month - 1, parsed.day);
  }
  return new Date();
};
>>>>>>> Stashed changes

const DaySelector = ({ selectedDate, onDateChange }) => {
  const scrollRef = useRef(null);

<<<<<<< Updated upstream
    const getWeekDays = () => {
        const today = selectedDate ? new Date(selectedDate) : new Date();
        const dayOfWeek = today.getDay();
        const days = [];
=======
  const getWeekDays = () => {
    const today = selectedDate ? parseSelectedDate(selectedDate) : new Date();
    const days = [];
>>>>>>> Stashed changes

    for (let i = -3; i <= 3; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const weekDays = getWeekDays();

  const isSelected = (date) => {
    const sel = selectedDate ? parseSelectedDate(selectedDate) : new Date();
    return date.toDateString() === sel.toDateString();
  };

<<<<<<< Updated upstream
    const isSelected = (date) => {
        const sel = selectedDate ? new Date(selectedDate) : new Date();
        return date.toDateString() === sel.toDateString();
    };

    const formatMonthYear = () => {
        const date = selectedDate ? new Date(selectedDate) : new Date();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    };

    const goToPrevWeek = () => {
        const date = selectedDate ? new Date(selectedDate) : new Date();
        date.setDate(date.getDate() - 7);
        onDateChange(date.toISOString().split('T')[0]);
    };

    const goToNextWeek = () => {
        const date = selectedDate ? new Date(selectedDate) : new Date();
        date.setDate(date.getDate() + 7);
        onDateChange(date.toISOString().split('T')[0]);
    };

    return (
        <View style={styles.container}>
            <View style={styles.weekRow}>
                <TouchableOpacity onPress={goToPrevWeek} style={styles.arrowBtn}>
                    <Ionicons name="chevron-back" size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>

                <View style={styles.daysContainer}>
                    {weekDays.map((date, index) => {
                        const selected = isSelected(date);
                        return (
                            <TouchableOpacity
                                key={index}
                                style={[styles.dayItem, selected && styles.dayItemSelected]}
                                onPress={() => onDateChange(date.toISOString().split('T')[0])}
                            >
                                <Text style={[styles.dayLabel, selected && styles.dayLabelSelected]}>
                                    {DAYS[date.getDay()]}
                                </Text>
                                <Text style={[styles.dayNumber, selected && styles.dayNumberSelected]}>
                                    {date.getDate()}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <TouchableOpacity onPress={goToNextWeek} style={styles.arrowBtn}>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
            </View>
=======
  const formatMonthYear = () => {
    const date = selectedDate ? parseSelectedDate(selectedDate) : new Date();
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const goToPrevWeek = () => {
    const date = selectedDate ? parseSelectedDate(selectedDate) : new Date();
    date.setDate(date.getDate() - 7);
    onDateChange(toVietnamDateString(date));
  };

  const goToNextWeek = () => {
    const date = selectedDate ? parseSelectedDate(selectedDate) : new Date();
    date.setDate(date.getDate() + 7);
    onDateChange(toVietnamDateString(date));
  };

  return (
    <View style={styles.container}>
      <View style={styles.weekRow}>
        <TouchableOpacity onPress={goToPrevWeek} style={styles.arrowBtn}>
          <Ionicons name="chevron-back" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <View style={styles.daysContainer}>
          {weekDays.map((date, index) => {
            const selected = isSelected(date);
            return (
              <TouchableOpacity
                key={index}
                style={[styles.dayItem, selected && styles.dayItemSelected]}
                onPress={() => onDateChange(toVietnamDateString(date))}
              >
                <Text style={[styles.dayLabel, selected && styles.dayLabelSelected]}>
                  {DAYS[date.getDay()]}
                </Text>
                <Text style={[styles.dayNumber, selected && styles.dayNumberSelected]}>
                  {date.getDate()}
                </Text>
              </TouchableOpacity>
            );
          })}
>>>>>>> Stashed changes
        </View>

        <TouchableOpacity onPress={goToNextWeek} style={styles.arrowBtn}>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      <Text style={styles.monthText}>{formatMonthYear()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    paddingVertical: SIZES.paddingSM,
    borderRadius: SIZES.radiusLG,
    marginBottom: SIZES.paddingLG,
  },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  arrowBtn: {
    padding: 4,
  },
  daysContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  dayItem: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: SIZES.radiusLG,
    minWidth: 40,
  },
  dayItemSelected: {
    backgroundColor: COLORS.primary,
  },
  dayLabel: {
    fontSize: SIZES.xs,
    color: COLORS.textSecondary,
    ...FONTS.medium,
    marginBottom: 4,
  },
  dayLabelSelected: {
    color: COLORS.textWhite,
  },
  dayNumber: {
    fontSize: SIZES.lg,
    color: COLORS.text,
    ...FONTS.bold,
  },
  dayNumberSelected: {
    color: COLORS.textWhite,
  },
  monthText: {
    marginTop: 6,
    textAlign: 'center',
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
    ...FONTS.medium,
  },
});

export default DaySelector;
