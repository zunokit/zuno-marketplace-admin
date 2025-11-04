/**
 * Data Export Utilities
 * Export data to CSV and JSON formats using generic functions
 */

/**
 * Escape CSV value (handle quotes, commas, newlines)
 */
function escapeCSVValue(value: string): string {
  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/**
 * Format value for export (handle null, objects, arrays, etc.)
 */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }

  if (typeof value === 'object') {
    return JSON.stringify(value)
  }

  return String(value)
}

/**
 * Generic data converter function
 */
type DataConverter<T> = (data: T) => string;

/**
 * Convert array of objects to CSV string
 */
export function convertToCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) {
    return ''
  }

  // Get headers from first object
  const headers = Object.keys(data[0])

  // Create CSV header row
  const csvHeaders = headers.map(escapeCSVValue).join(',')

  // Create CSV data rows
  const csvRows = data.map((row) => {
    return headers
      .map((header) => {
        const value = row[header]
        return escapeCSVValue(formatValue(value))
      })
      .join(',')
  })

  return [csvHeaders, ...csvRows].join('\n')
}

/**
 * Generic data formatter function
 */
function formatData<T>(
  data: T,
  converter: DataConverter<T>,
  mimeType: string
): Blob {
  const content = converter(data);
  return new Blob([content], { type: `${mimeType};charset=utf-8;` });
}

/**
 * Download blob as file
 */
function downloadBlob(blob: Blob, filename: string): void {
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Clean up the URL object
  setTimeout(() => URL.revokeObjectURL(url), 100)
}

/**
 * Generic download function
 */
function downloadGeneric<T>(
  data: T,
  filename: string,
  converter: DataConverter<T>,
  mimeType: string,
  extension: string
): void {
  const blob = formatData(data, converter, mimeType);
  downloadBlob(blob, `${filename}.${extension}`);
}

/**
 * Download data as CSV file
 */
export function downloadCSV(data: Record<string, unknown>[], filename: string): void {
  downloadGeneric(data, filename, convertToCSV, 'text/csv', 'csv');
}

/**
 * Download data as JSON file
 */
export function downloadJSON(data: Record<string, unknown>[], filename: string): void {
  downloadGeneric(data, filename, (d) => JSON.stringify(d, null, 2), 'application/json', 'json');
}
