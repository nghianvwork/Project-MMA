import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../theme/theme';
import { parseVietnamSqlDateTime, toVietnamDateString } from '../utils/dateTime';

const DAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const parseSelectedDate = (value) => {
  const parsed = parseVietnamSqlDateTime(value);
  if (parsed) {
    return new Date(parsed.year, parsed.month - 1, parsed.day);
  }
  return new Date();
};

const DaySelector = ({ selectedDate, onDateChange }) => {
  const scrollRef = useRef(null);

  const getWeekDays = () => {
    const today = selectedDate ? parseSelectedDate(selectedDate) : new Date();
    const days = [];

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

  const formatMonthYear = () => {
    const date = selectedDate ? parseSelectedDate(selectedDate) : new Date();
    const months = ['Thg 1', 'Thg 2', 'Thg 3', 'Thg 4', 'Thg 5', 'Thg 6', 'Thg 7', 'Thg 8', 'Thg 9', 'Thg 10', 'Thg 11', 'Thg 12'];
    return `${months[date.getMonth()]}, ${date.getFullYear()}`;
  };

  const goToPreviousWeek = () => {
    const base = selectedDate ? parseSelectedDate(selectedDate) : new Date();
    const prev = new Date(base);
    prev.setDate(base.getDate() - 7);
    onDateChange?.(toVietnamDateString(prev));
  };

  const goToNextWeek = () => {
    const base = selectedDate ? parseSelectedDate(selectedDate) : new Date();
    const next = new Date(base);
    next.setDate(base.getDate() + 7);
    onDateChange?.(toVietnamDateString(next));
  };

  return (
    <View style={styles.container}>
      <View style={styles.weekRow}>
        <TouchableOpacity onPress={goToPreviousWeek} style={styles.arrowBtn}>
          <Ionicons name="chevron-back" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <View ref={scrollRef} style={styles.daysContainer}>
          {weekDays.map((date) => {
            const selected = isSelected(date);
            return (
              <TouchableOpacity
                key={date.toISOString()}
                style={[styles.dayItem, selected && styles.dayItemSelected]}
                onPress={() => onDateChange?.(toVietnamDateString(date))}
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