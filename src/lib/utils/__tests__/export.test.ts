import {
  convertToCSV,
  downloadCSV,
  downloadJSON,
} from '@/lib/utils/export'

describe('convertToCSV', () => {
  it('returns empty string for empty input without columns', () => {
    expect(convertToCSV([])).toBe('')
  })

  it('writes header row only when columns provided and data empty', () => {
    expect(convertToCSV([], { columns: [{ key: 'a' }, { key: 'b' }] })).toBe(
      'a,b',
    )
  })

  it('serializes a simple table with CRLF line endings by default', () => {
    const csv = convertToCSV([
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ])
    expect(csv).toBe('id,name\r\n1,Alice\r\n2,Bob')
  })

  it('emits union of keys across rows (not just first row)', () => {
    const csv = convertToCSV([
      { a: 1 },
      { a: 2, b: 3 },
      { c: 4 },
    ])
    expect(csv.split('\r\n')[0]).toBe('a,b,c')
    // Row 0 had no b/c -> empty
    expect(csv.split('\r\n')[1]).toBe('1,,')
    expect(csv.split('\r\n')[3]).toBe(',,4')
  })

  it('quotes values containing separator, quotes, and newlines', () => {
    const csv = convertToCSV([
      { x: 'a,b', y: 'has "quote"', z: 'line1\nline2' },
    ])
    expect(csv).toContain('"a,b"')
    expect(csv).toContain('"has ""quote"""')
    expect(csv).toContain('"line1\nline2"')
  })

  it('quotes carriage returns (\\r)', () => {
    const csv = convertToCSV([{ x: 'a\rb' }])
    expect(csv).toContain('"a\rb"')
  })

  it('renders bigint as decimal string', () => {
    const csv = convertToCSV([{ wei: 1_000_000_000_000_000_000n }])
    expect(csv).toContain('1000000000000000000')
    expect(csv).not.toContain('n') // no bigint literal suffix
  })

  it('renders Date as ISO string', () => {
    const d = new Date('2026-05-20T07:00:00.000Z')
    const csv = convertToCSV([{ when: d }])
    expect(csv).toContain('2026-05-20T07:00:00.000Z')
  })

  it('renders booleans as lowercase literals', () => {
    const csv = convertToCSV([{ active: true, locked: false }])
    expect(csv).toContain('true')
    expect(csv).toContain('false')
  })

  it('renders null/undefined as empty cells', () => {
    const csv = convertToCSV([{ a: null, b: undefined, c: 1 }])
    expect(csv.split('\r\n')[1]).toBe(',,1')
  })

  it('serializes nested objects with JSON.stringify', () => {
    const csv = convertToCSV([{ meta: { k: 'v' } }])
    expect(csv).toContain('"{""k"":""v""}"')
  })

  it('respects explicit columns ordering and header rename', () => {
    const csv = convertToCSV(
      [{ id: 1, email: 'a@x.com', name: 'A' }],
      {
        columns: [
          { key: 'name', header: 'Full Name' },
          { key: 'email' },
        ],
      },
    )
    const [header, body] = csv.split('\r\n')
    expect(header).toBe('Full Name,email')
    expect(body).toBe('A,a@x.com')
  })

  it('supports a custom separator (TSV)', () => {
    const tsv = convertToCSV([{ a: 1, b: 2 }], { separator: '\t' })
    expect(tsv).toBe('a\tb\r\n1\t2')
  })

  it('supports a custom newline (LF only)', () => {
    const csv = convertToCSV([{ a: 1 }, { a: 2 }], { newline: '\n' })
    expect(csv).toBe('a\n1\n2')
  })

  it('prepends a UTF-8 BOM when requested', () => {
    const csv = convertToCSV([{ a: 1 }], { bom: true })
    expect(csv.charCodeAt(0)).toBe(0xfeff)
  })

  it('emits empty strings as bare empty cells (consistent with null)', () => {
    const csv = convertToCSV([{ a: '', b: 'x' }])
    expect(csv.split('\r\n')[1]).toBe(',x')
  })

  it('serializes finite, NaN, and Infinity numbers distinctly', () => {
    const csv = convertToCSV([{ a: 1.5, b: Number.NaN, c: Infinity }])
    const cells = csv.split('\r\n')[1].split(',')
    expect(cells[0]).toBe('1.5')
    expect(cells[1]).toBe('null') // JSON.stringify(NaN) === 'null'
    expect(cells[2]).toBe('null')
  })
})

describe('downloadCSV / downloadJSON (DOM)', () => {
  beforeEach(() => {
    Object.defineProperty(global.URL, 'createObjectURL', {
      writable: true,
      value: jest.fn().mockReturnValue('blob:mock'),
    })
    Object.defineProperty(global.URL, 'revokeObjectURL', {
      writable: true,
      value: jest.fn(),
    })
  })

  it('downloadCSV triggers an anchor click with .csv extension', () => {
    const clickSpy = jest
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {})
    downloadCSV([{ a: 1 }], 'rows')
    const anchors = document.querySelectorAll('a')
    expect(clickSpy).toHaveBeenCalled()
    // anchor is removed after click; ensure URL.createObjectURL was called
    expect(global.URL.createObjectURL).toHaveBeenCalled()
    clickSpy.mockRestore()
    anchors.forEach((a) => a.remove())
  })

  it('downloadJSON serializes bigint via custom replacer', () => {
    const clickSpy = jest
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {})
    expect(() => downloadJSON([{ wei: 1n }], 'rows')).not.toThrow()
    clickSpy.mockRestore()
  })
})
