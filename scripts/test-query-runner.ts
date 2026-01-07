/**
 * Test Query Runner - SQL Validation
 * Simulates the query runner's security validation
 * Run: npx tsx scripts/test-query-runner.ts
 */

import 'dotenv/config'
import postgres from 'postgres'

const PROJECT_DB_URL = 'postgresql://neondb_owner:npg_4jXb6CxEAIyv@ep-autumn-pine-adoverva-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require'

// Simulating QueryValidationService
class QueryValidator {
  isReadOnlyQuery(query: string): boolean {
    const trimmed = query.trim().toLowerCase()
    const readOnlyPatterns = [/^select\s/i, /^show\s/i, /^explain\s/i, /^describe\s/i, /^desc\s/i]
    return readOnlyPatterns.some(p => p.test(trimmed))
  }

  isDangerousQuery(query: string): boolean {
    const dangerous = [
      /drop\s+(table|database|schema|index)/i,
      /truncate\s+table/i,
      /alter\s+(table|database)/i,
      /create\s+(table|database|schema)/i,
      /grant\s/i,
      /revoke\s/i,
    ]
    return dangerous.some(p => p.test(query))
  }

  containsSuspiciousPatterns(query: string): boolean {
    const suspicious = [
      /;\s*drop\s/i,
      /;\s*delete\s+from/i,
      /union\s+select/i,
      /'\s*or\s*'1'\s*=\s*'1/i,
      /--\s*$/,
    ]
    return suspicious.some(p => p.test(query))
  }

  validate(query: string, allowMutations: boolean = false): { 
    isValid: boolean
    isReadOnly: boolean
    isDangerous: boolean
    errors: string[] 
  } {
    const errors: string[] = []
    
    if (!query?.trim()) {
      return { isValid: false, isReadOnly: false, isDangerous: false, errors: ['Query cannot be empty'] }
    }

    const isReadOnly = this.isReadOnlyQuery(query)
    const isDangerous = this.isDangerousQuery(query)

    if (isDangerous) {
      errors.push('Dangerous operations are not allowed')
    }

    if (!isReadOnly && !allowMutations) {
      errors.push('Only read-only queries are allowed')
    }

    if (this.containsSuspiciousPatterns(query)) {
      errors.push('Query contains suspicious patterns')
    }

    return { isValid: errors.length === 0, isReadOnly, isDangerous, errors }
  }

  sanitize(query: string): string {
    return query
      .replace(/--.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }
}

async function main() {
  console.log('🔍 Testing Query Runner Validation')
  console.log('='.repeat(50))

  const validator = new QueryValidator()
  let passed = 0
  let failed = 0

  // Test cases
  const testCases = [
    // Valid read-only queries
    { query: 'SELECT * FROM users', allowMutations: false, expectValid: true, desc: 'Simple SELECT' },
    { query: 'SELECT id, name FROM users WHERE id = 1', allowMutations: false, expectValid: true, desc: 'SELECT with WHERE' },
    { query: 'SELECT COUNT(*) FROM users', allowMutations: false, expectValid: true, desc: 'SELECT with aggregate' },
    { query: 'EXPLAIN SELECT * FROM users', allowMutations: false, expectValid: true, desc: 'EXPLAIN query' },
    
    // Invalid - mutations without permission
    { query: 'INSERT INTO users (name) VALUES (\'test\')', allowMutations: false, expectValid: false, desc: 'INSERT without permission' },
    { query: 'UPDATE users SET name = \'test\'', allowMutations: false, expectValid: false, desc: 'UPDATE without permission' },
    { query: 'DELETE FROM users WHERE id = 1', allowMutations: false, expectValid: false, desc: 'DELETE without permission' },
    
    // Valid - mutations with permission
    { query: 'INSERT INTO users (name) VALUES (\'test\')', allowMutations: true, expectValid: true, desc: 'INSERT with permission' },
    { query: 'UPDATE users SET name = \'test\'', allowMutations: true, expectValid: true, desc: 'UPDATE with permission' },
    
    // Dangerous queries - always blocked
    { query: 'DROP TABLE users', allowMutations: true, expectValid: false, desc: 'DROP TABLE' },
    { query: 'TRUNCATE TABLE users', allowMutations: true, expectValid: false, desc: 'TRUNCATE' },
    { query: 'ALTER TABLE users ADD COLUMN test TEXT', allowMutations: true, expectValid: false, desc: 'ALTER TABLE' },
    { query: 'CREATE TABLE test (id INT)', allowMutations: true, expectValid: false, desc: 'CREATE TABLE' },
    { query: 'GRANT ALL ON users TO public', allowMutations: true, expectValid: false, desc: 'GRANT' },
    
    // SQL injection patterns
    { query: "SELECT * FROM users; DROP TABLE users;--", allowMutations: false, expectValid: false, desc: 'Chained DROP injection' },
    { query: "SELECT * FROM users WHERE id = '1' OR '1'='1'", allowMutations: false, expectValid: false, desc: 'OR injection' },
    { query: "SELECT * FROM users UNION SELECT * FROM passwords", allowMutations: false, expectValid: false, desc: 'UNION injection' },
  ]

  console.log('\n📋 Running validation tests...\n')

  for (const tc of testCases) {
    const result = validator.validate(tc.query, tc.allowMutations)
    const success = result.isValid === tc.expectValid
    
    if (success) {
      console.log(`✅ ${tc.desc}`)
      passed++
    } else {
      console.log(`❌ ${tc.desc}`)
      console.log(`   Expected: ${tc.expectValid ? 'valid' : 'invalid'}, Got: ${result.isValid ? 'valid' : 'invalid'}`)
      console.log(`   Errors: ${result.errors.join(', ')}`)
      failed++
    }
  }

  // Test sanitization
  console.log('\n📝 Testing query sanitization...\n')
  
  const sanitizeTests = [
    { input: 'SELECT * FROM users -- comment', expected: 'SELECT * FROM users' },
    { input: 'SELECT * FROM users /* block comment */', expected: 'SELECT * FROM users' },
    { input: 'SELECT   *   FROM    users', expected: 'SELECT * FROM users' },
  ]

  for (const st of sanitizeTests) {
    const result = validator.sanitize(st.input)
    if (result === st.expected) {
      console.log(`✅ Sanitized: "${st.input.substring(0, 40)}..."`)
      passed++
    } else {
      console.log(`❌ Sanitize failed for: "${st.input}"`)
      console.log(`   Expected: "${st.expected}", Got: "${result}"`)
      failed++
    }
  }

  // Test actual query execution
  console.log('\n🔌 Testing actual query execution...\n')
  
  const sql = postgres(PROJECT_DB_URL, { max: 1 })
  
  try {
    // Valid query
    const validQuery = 'SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\' LIMIT 5'
    const validation = validator.validate(validQuery, false)
    
    if (validation.isValid) {
      const result = await sql.unsafe(validQuery)
      console.log(`✅ Executed valid query: ${result.length} rows returned`)
      passed++
    }

    // Test that dangerous query is blocked before execution
    const dangerousQuery = 'DROP TABLE test_table'
    const dangerValidation = validator.validate(dangerousQuery, true)
    
    if (!dangerValidation.isValid) {
      console.log(`✅ Dangerous query blocked before execution`)
      passed++
    } else {
      console.log(`❌ Dangerous query was not blocked!`)
      failed++
    }

  } catch (error) {
    console.log(`❌ Query execution error: ${error}`)
    failed++
  }

  await sql.end()

  console.log('\n' + '='.repeat(50))
  console.log(`📊 Results: ${passed} passed, ${failed} failed`)
  
  if (failed > 0) {
    process.exit(1)
  }
  console.log('✅ All Query Runner tests passed!')
}

main()
