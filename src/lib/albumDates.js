const MONTH_INDEX = {
  january: 0, jan: 0,
  february: 1, feb: 1,
  march: 2, mar: 2,
  april: 3, apr: 3,
  may: 4,
  june: 5, jun: 5,
  july: 6, jul: 6,
  august: 7, aug: 7,
  september: 8, sep: 8, sept: 8,
  october: 9, oct: 9,
  november: 10, nov: 10,
  december: 11, dec: 11,
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function formatMonthName(raw) {
  const month = MONTH_INDEX[raw?.toLowerCase()]
  return month != null ? MONTH_NAMES[month] : raw
}

function centuryYear(twoDigit) {
  const n = Number(twoDigit)
  return n >= 50 ? 1900 + n : 2000 + n
}

/** Parse album date labels into a sortable timestamp (ms). */
export function parseAlbumDateLabel(label) {
  const text = label?.trim()
  if (!text) return null

  const season = text.match(/season\s*(\d{2})\s*[–-]\s*(\d{2})/i)
  if (season) {
    return new Date(centuryYear(season[1]), 8, 1).getTime()
  }

  const monthYear = text.match(
    /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\b[\s,]+(\d{4})/i
  )
  if (monthYear) {
    const month = MONTH_INDEX[monthYear[1].toLowerCase()]
    if (month != null) return new Date(Number(monthYear[2]), month, 1).getTime()
  }

  const monthDayYear = text.match(
    /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\b\s+(\d{1,2}),?\s+(\d{4})/i
  )
  if (monthDayYear) {
    const month = MONTH_INDEX[monthDayYear[1].toLowerCase()]
    if (month != null) {
      return new Date(Number(monthDayYear[3]), month, Number(monthDayYear[2])).getTime()
    }
  }

  const yearOnly = text.match(/\b(20\d{2})\b/)
  if (yearOnly) return new Date(Number(yearOnly[1]), 0, 1).getTime()

  return null
}

/** Display tag for grouping — month/season only, no year. */
export function albumDateDisplayTag(label) {
  const text = label?.trim()
  if (!text) return 'Undated'

  const season = text.match(/season\s*\d{2}\s*[–-]\s*\d{2}/i)
  if (season) {
    return season[0].replace(/\s+/g, ' ').replace(/season/i, 'Season')
  }

  const monthDayYear = text.match(
    /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\b\s+(\d{1,2}),?\s+(\d{4})/i
  )
  if (monthDayYear) {
    return `${formatMonthName(monthDayYear[1])} ${monthDayYear[2]}`
  }

  const monthYear = text.match(
    /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\b/i
  )
  if (monthYear) {
    return formatMonthName(monthYear[1])
  }

  if (/^\s*20\d{2}\s*$/.test(text)) return 'Undated'

  const withoutYear = text.replace(/,?\s*\b20\d{2}\b/g, '').replace(/\s+/g, ' ').trim()
  return withoutYear || 'Undated'
}

export function albumDateGroupKey(label) {
  return albumDateDisplayTag(label)
}

export function sortAlbumsByDate(albums, direction = 'desc') {
  return [...albums].sort((a, b) => {
    const ta = parseAlbumDateLabel(a.date)
    const tb = parseAlbumDateLabel(b.date)

    if (ta != null && tb != null && ta !== tb) {
      return direction === 'desc' ? tb - ta : ta - tb
    }
    if (ta != null && tb == null) return direction === 'desc' ? -1 : 1
    if (ta == null && tb != null) return direction === 'desc' ? 1 : -1

    const sortDiff = (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
    if (sortDiff !== 0) return sortDiff

    return a.title.localeCompare(b.title)
  })
}

export function groupAlbumsByDateTag(albums) {
  const sorted = sortAlbumsByDate(albums)
  const groups = []

  for (const album of sorted) {
    const key = albumDateGroupKey(album.date)
    const last = groups[groups.length - 1]
    if (last?.key === key) {
      last.albums.push(album)
    } else {
      groups.push({ key, albums: [album] })
    }
  }

  return groups
}
