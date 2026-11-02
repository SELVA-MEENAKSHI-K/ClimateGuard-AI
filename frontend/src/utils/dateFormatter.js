/**
 * frontend/src/utils/dateFormatter.js
 *
 * Locale-aware date formatter using native Intl.DateTimeFormat (ta-IN / en-IN).
 * Ensures zero hardcoded date strings across the application.
 */

export function formatDayDate(dateStr, lang = 'en') {
  if (!dateStr) return '';
  try {
    // Handle YYYY-MM-DD
    const parts = dateStr.split('-');
    let dateObj;
    if (parts.length === 3) {
      dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    } else {
      dateObj = new Date(dateStr);
    }

    if (isNaN(dateObj.getTime())) return dateStr;

    const locale = lang === 'ta' ? 'ta-IN' : 'en-IN';
    return new Intl.DateTimeFormat(locale, {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    }).format(dateObj);
  } catch (e) {
    return dateStr;
  }
}

export function formatFullDate(dateStr, lang = 'en') {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    let dateObj = parts.length === 3
      ? new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
      : new Date(dateStr);

    if (isNaN(dateObj.getTime())) return dateStr;

    const locale = lang === 'ta' ? 'ta-IN' : 'en-IN';
    return new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(dateObj);
  } catch (e) {
    return dateStr;
  }
}
