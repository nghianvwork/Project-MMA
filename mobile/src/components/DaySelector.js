import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../theme/theme';
import { parseVietnamSqlDateTime, toVietnamDateString } from '../utils/dateTime';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const parseSelectedDate = (value) => {
    const parsed = parseVietnamSqlDateTime(value);
    if (parsed) {
        return new Date(parsed.year, parsed.month - 1, parsed.day);
    }
    return new Date();
};
 main

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

    const isSelected = (date) => {
        const sel = selectedDate ? parseSelectedDate(selectedDate) : new Date();
        return date.toDateString() === sel.toDateString();
    };

    const formatMonthYear = () => {

        const date = selectedDate ? parseSelectedDate(selectedDate) : new Date();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
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
