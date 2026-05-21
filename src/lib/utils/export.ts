/**
 * Data Export Utilities
 *
 * Convert and download arrays of records to CSV / JSON. The CSV path
 * follows RFC-4180: fields containing the separator, double quote,
 * carriage return, or line feed are quoted; inner double quotes are
 * doubled.
 *
 * Improvements over the previous implementation:
 *   - Header set is the *union* of keys across all rows (previously
 *     only `Object.keys(data[0])` was used, so rows with extra
 *     columns silently lost data).
 *   - Quoting also escapes carriage returns (\r), not just \n.
 *   - bigint values render as decimal strings (no `n` suffix and no
 *     scientific notation collapse).
 *   - Date values render as ISO 8601 strings.
 *   - boolean values render as `true` / `false` literals.
 *   - Optional UTF-8 BOM for Excel friendliness.
 *   - Optional explicit `columns` ordering / header rename.
 *   - Optional separator override so the same code emits TSV.
 *   - The empty-array case is handled deterministically: a single
 *     line containing only column headers (when provided) or an
 *     empty string.
 *
 * The public functions (`convertToCSV`, `downloadCSV`, `downloadJSON`)
 * preserve their original signatures so existing call sites keep
 * working unchanged.
 */

/** Escape a single CSV cell per RFC-4180. */
function escapeCSVValue(value: string, separator: string): string {
  if (
    value.includes(separator) ||
    value.includes('"') ||
    value.includes('\n') ||
    value.includes('\r')
  ) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/**
 * Coerce an arbitrary value to its CSV-cell text representation.
 *
 * The coercion rules are intentionally explicit (no `String(...)`
 * fallback) so we can guarantee round-trip behavior for the types we
 * actually use in the admin UI.
 */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }
  if (typeof value === 'bigint') {
    return value.toString(10)
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }
  if (value instanceof Date) {
    return value.toISOString()
  }
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value.toString() : JSON.stringify(value)
  }
  return String(value)
}

/** Definition for an explicit CSV column (key + optional display header). */
export interface CsvColumn {
  /** Property key on each row object. */
  key: string
  /** Header label written to the first row. Defaults to `key`. */
  header?: string
}

/** Options accepted by {@link convertToCSV} / {@link downloadCSV}. */
export interface CsvOptions {
  /** Field separator (default `,`). Set to `\t` to emit TSV. */
  separator?: string
  /** Line terminator (default `\r\n`, also valid for Excel). */
  newline?: string
  /** Prepend a UTF-8 BOM so Excel detects encoding correctly. */
  bom?: boolean
  /**
   * Explicit column list. When provided, columns are written in this
   * order and other row keys are ignored. Headers default to `key`.
   */
  columns?: ReadonlyArray<CsvColumn>
}

function collectUnionHeaders(rows: ReadonlyArray<Record<string, unknown>>): string[] {
  const seen = new Set<string>()
  const headers: string[] = []
  for (const row of rows) {
    for (const k of Object.keys(row)) {
      if (!seen.has(k)) {
        seen.add(k)
        headers.push(k)
      }
    }
  }
  return headers
}

/**
 * Convert an array of plain objects to a CSV string. Returns an empty
 * string for empty input unless `columns` are provided, in which case
 * the header row is emitted on its own.
 */
export function convertToCSV(
  data: ReadonlyArray<Record<string, unknown>>,
  options: CsvOptions = {},
): string {
  const separator = options.separator ?? ','
  const newline = options.newline ?? '\r\n'
  const bom = options.bom ? '\uFEFF' : ''

  const columns: CsvColumn[] =
    options.columns?.map((c) => ({ key: c.key, header: c.header ?? c.key })) ??
    collectUnionHeaders(data).map((k) => ({ key: k, header: k }))

  if (columns.length === 0) {
    return ''
  }

  const headerRow = columns
    .map((c) => escapeCSVValue(c.header ?? c.key, separator))
    .join(separator)

  if (data.length === 0) {
    return bom + headerRow
  }

  const bodyRows = data.map((row) =>
    columns
      .map((c) => escapeCSVValue(formatValue(row[c.key]), separator))
      .join(separator),
  )

  return bom + [headerRow, ...bodyRows].join(newline)
}

type DataConverter<T> = (data: T) => string

function formatData<T>(
  data: T,
  converter: DataConverter<T>,
  mimeType: string,
): Blob {
  const content = converter(data)
  return new Blob([content], { type: `${mimeType};charset=utf-8;` })
}

function downloadBlob(blob: Blob, filename: string): void {
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Clean up the URL object asynchronously so download isn't aborted.
  setTimeout(() => URL.revokeObjectURL(url), 100)
}

function downloadGeneric<T>(
  data: T,
  filename: string,
  converter: DataConverter<T>,
  mimeType: string,
  extension: string,
): void {
  const blob = formatData(data, converter, mimeType)
  downloadBlob(blob, `${filename}.${extension}`)
}

/** Download an array of records as a `.csv` file. */
export function downloadCSV(
  data: ReadonlyArray<Record<string, unknown>>,
  filename: string,
  options: CsvOptions = {},
): void {
  downloadGeneric(
    data,
    filename,
    (d) => convertToCSV(d, options),
    'text/csv',
    'csv',
  )
}

/** Download an array of records as a `.json` file. */
export function downloadJSON(
  data: ReadonlyArray<Record<string, unknown>>,
  filename: string,
): void {
  downloadGeneric(
    data,
    filename,
    (d) =>
      JSON.stringify(
        d,
        (_key, value) =>
          typeof value === 'bigint' ? value.toString() : value,
        2,
      ),
    'application/json',
    'json',
  )
}
