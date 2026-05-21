/**
 * Unit tests for PostgreSQL connection-string utilities.
 */

import {
  getConnectionStringError,
  isValidPostgresUrl,
  normalizeConnectionString,
  parsePostgresUrl,
} from "../normalize-connection-string";

const VALID =
  "postgresql://alice:secret@db.example.com:5433/zuno?sslmode=require";

describe("normalizeConnectionString", () => {
  it("trims surrounding whitespace and newlines", () => {
    expect(normalizeConnectionString(`  ${VALID}\n`)).toBe(VALID);
  });
});

describe("isValidPostgresUrl", () => {
  it("accepts a complete URL with credentials, port, db and params", () => {
    expect(isValidPostgresUrl(VALID)).toBe(true);
  });

  it("accepts a URL without password, port or query params", () => {
    expect(isValidPostgresUrl("postgresql://alice@db/foo")).toBe(true);
  });

  it("rejects URLs with the wrong protocol", () => {
    expect(isValidPostgresUrl("mysql://alice:secret@host/db")).toBe(false);
    expect(isValidPostgresUrl("http://alice@host/db")).toBe(false);
  });

  it("rejects malformed URLs", () => {
    expect(isValidPostgresUrl("postgresql://")).toBe(false);
    expect(isValidPostgresUrl("postgresql://alice@/")).toBe(false);
    expect(isValidPostgresUrl("")).toBe(false);
  });
});

describe("parsePostgresUrl", () => {
  it("extracts user, password, host, port, database and params", () => {
    expect(parsePostgresUrl(VALID)).toEqual({
      user: "alice",
      password: "secret",
      host: "db.example.com",
      port: 5433,
      database: "zuno",
      params: "?sslmode=require",
    });
  });

  it("defaults port to 5432 when omitted", () => {
    const parsed = parsePostgresUrl("postgresql://alice@host/db");
    expect(parsed).not.toBeNull();
    expect(parsed?.port).toBe(5432);
    expect(parsed?.password).toBeUndefined();
    expect(parsed?.params).toBeUndefined();
  });

  it("returns null for invalid URLs", () => {
    expect(parsePostgresUrl("not-a-url")).toBeNull();
    expect(parsePostgresUrl("")).toBeNull();
  });
});

describe("getConnectionStringError", () => {
  it("returns null for valid URLs", () => {
    expect(getConnectionStringError(VALID)).toBeNull();
  });

  it("returns a 'cannot be empty' message for blank input", () => {
    expect(getConnectionStringError("   ")).toBe(
      "Connection string cannot be empty",
    );
  });

  it("returns a protocol error when scheme is wrong", () => {
    expect(getConnectionStringError("mysql://a:b@h/d")).toBe(
      "Connection string must start with 'postgresql://'",
    );
  });

  it("returns a format error for malformed connection strings", () => {
    expect(getConnectionStringError("postgresql://broken")).toBe(
      "Invalid PostgreSQL connection string format. Expected: postgresql://user:password@host:port/database",
    );
  });
});
