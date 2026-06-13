const MONTH_NAMES = {
  JAN: 'January',
  FEB: 'February',
  MAR: 'March',
  APR: 'April',
  MAY: 'May',
  JUN: 'June',
  JUL: 'July',
  AUG: 'August',
  SEP: 'September',
  OCT: 'October',
  NOV: 'November',
  DEC: 'December',
}

export function buildDateLabel({ day, month, year, dateLabel }) {
  if (dateLabel?.trim()) return dateLabel.trim()
  if (!day || !month) return ''
  const monthName = MONTH_NAMES[String(month).toUpperCase()] || month
  return year ? `${monthName} ${day}, ${year}` : `${monthName} ${day}`
}
