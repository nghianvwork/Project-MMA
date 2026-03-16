const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;

const normalizeDate = (value = new Date()) => (value instanceof Date ? value : new Date(value));

const toVietnamShiftedDate = (value = new Date()) => {
    const date = normalizeDate(value);
    return new Date(date.getTime() + VIETNAM_OFFSET_MS);
};

const pad = (value) => String(value).padStart(2, '0');

export const toVietnamDateParts = (value = new Date()) => {
    const date = toVietnamShiftedDate(value);
    return {
        year: date.getUTCFullYear(),
        month: date.getUTCMonth() + 1,
        day: date.getUTCDate(),
        hours: date.getUTCHours(),
        minutes: date.getUTCMinutes(),
        seconds: date.getUTCSeconds(),
    };
};

export const toVietnamDateString = (value = new Date()) => {
    const { year, month, day } = toVietnamDateParts(value);
    return `${year}-${pad(month)}-${pad(day)}`;
};

export const toVietnamSqlDateTime = (value = new Date()) => {
    const { year, month, day, hours, minutes, seconds } = toVietnamDateParts(value);
    return `${year}-${pad(month)}-${pad(day)} ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

export const getVietnamWeekday = (value = new Date()) => {
    const shifted = toVietnamShiftedDate(value);
    return shifted.getUTCDay();
};

export const parseVietnamSqlDateTime = (value) => {
    const raw = String(value || '').trim();
    const match = raw.match(
        /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/
    );

    if (!match) {
        return null;
    }

    const [, year, month, day, hours = '00', minutes = '00', seconds = '00'] = match;
    return {
        year: Number(year),
        month: Number(month),
        day: Number(day),
        hours: Number(hours),
        minutes: Number(minutes),
        seconds: Number(seconds),
    };
};

export const formatVietnamClock = (value) => {
    const parsed = parseVietnamSqlDateTime(value);
    if (parsed) {
        return `${pad(parsed.hours)}:${pad(parsed.minutes)}`;
    }

    const date = normalizeDate(value);
    if (!Number.isNaN(date.getTime())) {
        const shifted = toVietnamShiftedDate(date);
        return `${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}`;
    }

    return '--:--';
};
