/**
 * Unit tests for pagination utilities.
 */

import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  MAX_LIMIT,
  MIN_LIMIT,
  buildLimitOffset,
  calculateOffset,
  calculatePaginationMeta,
  createCursorPaginatedResult,
  createEmptyPaginatedResult,
  createPaginatedResult,
  extractPaginationParams,
  isValidPaginationParams,
  normalizePaginationParams,
} from "../pagination";

describe("calculatePaginationMeta", () => {
  it("computes total pages, next/previous flags for a middle page", () => {
    const meta = calculatePaginationMeta(57, 2, 10);
    expect(meta).toEqual({
      page: 2,
      limit: 10,
      total: 57,
      totalPages: 6,
      hasNextPage: true,
      hasPreviousPage: true,
    });
  });

  it("marks last page when page equals totalPages", () => {
    const meta = calculatePaginationMeta(30, 3, 10);
    expect(meta.hasNextPage).toBe(false);
    expect(meta.hasPreviousPage).toBe(true);
  });

  it("handles total = 0", () => {
    const meta = calculatePaginationMeta(0, 1, 10);
    expect(meta.totalPages).toBe(0);
    expect(meta.hasNextPage).toBe(false);
    expect(meta.hasPreviousPage).toBe(false);
  });
});

describe("calculateOffset", () => {
  it("returns 0 for page 1", () => {
    expect(calculateOffset(1, 25)).toBe(0);
  });

  it("multiplies (page - 1) by limit", () => {
    expect(calculateOffset(4, 25)).toBe(75);
  });
});

describe("normalizePaginationParams", () => {
  it("returns defaults when params are empty", () => {
    expect(normalizePaginationParams({})).toEqual({
      page: DEFAULT_PAGE,
      limit: DEFAULT_LIMIT,
      sortBy: undefined,
      sortOrder: "asc",
    });
  });

  it("clamps page to >= 1", () => {
    expect(normalizePaginationParams({ page: 0 }).page).toBe(1);
    expect(normalizePaginationParams({ page: -5 }).page).toBe(1);
  });

  it("clamps limit to [MIN_LIMIT, MAX_LIMIT]", () => {
    expect(normalizePaginationParams({ limit: 0 }).limit).toBe(DEFAULT_LIMIT);
    expect(normalizePaginationParams({ limit: 999 }).limit).toBe(MAX_LIMIT);
    expect(normalizePaginationParams({ limit: MIN_LIMIT }).limit).toBe(MIN_LIMIT);
  });

  it("preserves sortBy and sortOrder when provided", () => {
    expect(
      normalizePaginationParams({ sortBy: "created_at", sortOrder: "desc" }),
    ).toMatchObject({ sortBy: "created_at", sortOrder: "desc" });
  });
});

describe("createPaginatedResult", () => {
  it("wraps data with meta computed from params", () => {
    const result = createPaginatedResult([1, 2], 10, {
      page: 1,
      limit: 2,
      sortOrder: "asc",
    });
    expect(result.data).toEqual([1, 2]);
    expect(result.meta.totalPages).toBe(5);
    expect(result.meta.hasNextPage).toBe(true);
  });
});

describe("extractPaginationParams", () => {
  it("parses numeric strings from query", () => {
    const parsed = extractPaginationParams({
      page: "3",
      limit: "20",
      sortBy: "name",
      sortOrder: "desc",
    });
    expect(parsed).toEqual({
      page: 3,
      limit: 20,
      sortBy: "name",
      sortOrder: "desc",
    });
  });

  it("falls back to defaults for missing/invalid values", () => {
    const parsed = extractPaginationParams({});
    expect(parsed.page).toBe(DEFAULT_PAGE);
    expect(parsed.limit).toBe(DEFAULT_LIMIT);
  });
});

describe("isValidPaginationParams", () => {
  it("accepts well-formed params", () => {
    expect(
      isValidPaginationParams({ page: 1, limit: 10, sortOrder: "asc" }),
    ).toBe(true);
  });

  it("rejects non-objects", () => {
    expect(isValidPaginationParams(null)).toBe(false);
    expect(isValidPaginationParams(undefined)).toBe(false);
    expect(isValidPaginationParams("a")).toBe(false);
  });

  it("rejects out-of-range values", () => {
    expect(isValidPaginationParams({ page: 0, limit: 10 })).toBe(false);
    expect(isValidPaginationParams({ page: 1, limit: MAX_LIMIT + 1 })).toBe(false);
  });

  it("rejects invalid sortOrder", () => {
    expect(
      isValidPaginationParams({ page: 1, limit: 10, sortOrder: "ascending" }),
    ).toBe(false);
  });
});

describe("buildLimitOffset", () => {
  it("returns SQL-ready limit/offset pair", () => {
    expect(buildLimitOffset({ page: 3, limit: 25 })).toEqual({
      limit: 25,
      offset: 50,
    });
  });
});

describe("createEmptyPaginatedResult", () => {
  it("returns empty data and zeroed meta", () => {
    const empty = createEmptyPaginatedResult<number>();
    expect(empty.data).toEqual([]);
    expect(empty.meta.total).toBe(0);
    expect(empty.meta.hasNextPage).toBe(false);
    expect(empty.meta.hasPreviousPage).toBe(false);
  });
});

describe("createCursorPaginatedResult", () => {
  it("returns hasMore=true and next cursor when extra row is present", () => {
    const items = [{ id: "a" }, { id: "b" }, { id: "c" }];
    const result = createCursorPaginatedResult(items, 2);
    expect(result.data).toEqual([{ id: "a" }, { id: "b" }]);
    expect(result.hasMore).toBe(true);
    expect(result.nextCursor).toBe("b");
  });

  it("returns hasMore=false when items <= limit", () => {
    const result = createCursorPaginatedResult([{ id: "a" }], 5);
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeNull();
  });

  it("handles empty input", () => {
    const result = createCursorPaginatedResult<{ id: string }>([], 5);
    expect(result.data).toEqual([]);
    expect(result.nextCursor).toBeNull();
    expect(result.hasMore).toBe(false);
  });
});
