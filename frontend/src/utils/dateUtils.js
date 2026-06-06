import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Extend dayjs with plugins
dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(timezone);

// Format date to readable string
export const formatDate = (date, format = 'MMM DD, YYYY') => {
  return dayjs(date).format(format);
};

// Format time to readable string
export const formatTime = (date, format = 'hh:mm A') => {
  return dayjs(date).format(format);
};

// Get relative time (e.g., "2 hours ago")
export const getRelativeTime = (date) => {
  return dayjs(date).fromNow();
};

// Get formatted date and time together
export const formatDateTime = (date, format = 'MMM DD, YYYY hh:mm A') => {
  return dayjs(date).format(format);
};

// Check if date is in the past
export const isPast = (date) => {
  return dayjs(date).isBefore(dayjs());
};

// Check if date is in the future
export const isFuture = (date) => {
  return dayjs(date).isAfter(dayjs());
};

// Get days difference
export const getDaysDifference = (date1, date2) => {
  return dayjs(date1).diff(dayjs(date2), 'day');
};

// Get hours difference
export const getHoursDifference = (date1, date2) => {
  return dayjs(date1).diff(dayjs(date2), 'hour');
};

// Get date range string
export const getDateRangeString = (startDate, endDate) => {
  const start = dayjs(startDate).format('MMM DD');
  const end = dayjs(endDate).format('MMM DD, YYYY');
  return `${start} - ${end}`;
};

// Check if dates are same day
export const isSameDay = (date1, date2) => {
  return dayjs(date1).isSame(dayjs(date2), 'day');
};

// Get start of day
export const getStartOfDay = (date) => {
  return dayjs(date).startOf('day').toDate();
};

// Get end of day
export const getEndOfDay = (date) => {
  return dayjs(date).endOf('day').toDate();
};
