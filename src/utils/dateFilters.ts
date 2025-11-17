/**
 * Date filtering utilities
 */

/**
 * Filter items by end date (inclusive)
 * @param items Array of items with timestamp property
 * @param endDate End date string (ISO format) or null/empty for no filtering
 * @returns Filtered array
 */
export function filterByEndDate<T extends { timestamp: string }>(
  items: T[],
  endDate: string | null | undefined
): T[] {
  if (!endDate || !endDate.trim()) {
    return items
  }

  const endDateTimestamp = new Date(endDate.trim()).getTime()
  if (isNaN(endDateTimestamp)) {
    return items
  }

  return items.filter(item => {
    if (!item.timestamp) return true
    const itemTimestamp = new Date(item.timestamp).getTime()
    return !isNaN(itemTimestamp) && itemTimestamp <= endDateTimestamp
  })
}

/**
 * Filter items by date range (inclusive)
 * @param items Array of items with timestamp property
 * @param startDate Start date string (ISO format) or null/empty for no start filter
 * @param endDate End date string (ISO format) or null/empty for no end filter
 * @returns Filtered array
 */
export function filterByDateRange<T extends { timestamp: string }>(
  items: T[],
  startDate: string | null | undefined,
  endDate: string | null | undefined
): T[] {
  let filtered = items

  if (startDate && startDate.trim()) {
    const startDateTimestamp = new Date(startDate.trim()).getTime()
    if (!isNaN(startDateTimestamp)) {
      filtered = filtered.filter(item => {
        if (!item.timestamp) return false
        const itemTimestamp = new Date(item.timestamp).getTime()
        return !isNaN(itemTimestamp) && itemTimestamp >= startDateTimestamp
      })
    }
  }

  if (endDate && endDate.trim()) {
    filtered = filterByEndDate(filtered, endDate)
  }

  return filtered
}

