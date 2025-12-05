/**
 * Test Encryption Script
 * Run: npx tsx scripts/test-encryption.ts
 */

import 'dotenv/config'
import { encrypt, decrypt, generateEncryptionKey, generateSecureId } from '../src/lib/crypto'

function testEncryption() {
  console.log('🔐 Testing Encryption Module...\n')

  // Check ENCRYPTION_KEY
  if (!process.env.ENCRYPTION_KEY) {
    console.error('❌ ENCRYPTION_KEY not found in environment')
    process.exit(1)
  }
  console.log('✅ ENCRYPTION_KEY found')

  // Test encrypt/decrypt
  const testData = [
    'Hello World',
    'postgresql://user:password@localhost:5432/mydb',
    'Special chars: !@#$%^&*()_+-={}[]|:";\'<>?,./~`',
    '日本語テスト',
    '',
  ]

  console.log('\n📝 Testing encrypt/decrypt:')
  let passed = 0
  let failed = 0

  testData.forEach((data, i) => {
    try {
      const encrypted = encrypt(data)
      const decrypted = decrypt(encrypted)
      
      if (decrypted === data) {
        console.log(`   ${i + 1}. ✅ "${data.substring(0, 30)}${data.length > 30 ? '...' : ''}"`)
        passed++
      } else {
        console.log(`   ${i + 1}. ❌ Mismatch for "${data}"`)
        failed++
      }
    } catch (error) {
      console.log(`   ${i + 1}. ❌ Error: ${error}`)
      failed++
    }
  })

  // Test that same plaintext produces different ciphertext (IV randomization)
  console.log('\n🔀 Testing IV randomization:')
  const plaintext = 'test data'
  const enc1 = encrypt(plaintext)
  const enc2 = encrypt(plaintext)
  
  if (enc1 !== enc2) {
    console.log('   ✅ Different ciphertext for same plaintext (secure)')
    passed++
  } else {
    console.log('   ❌ Same ciphertext for same plaintext (insecure!)')
    failed++
  }

  // Test key generation
  console.log('\n🔑 Testing key generation:')
  const key1 = generateEncryptionKey()
  const key2 = generateEncryptionKey()
  
  if (key1.length === 64 && key2.length === 64 && key1 !== key2) {
    console.log('   ✅ Key generation working (64 chars, unique)')
    passed++
  } else {
    console.log('   ❌ Key generation issue')
    failed++
  }

  // Test secure ID generation
  console.log('\n🆔 Testing secure ID generation:')
  const id1 = generateSecureId()
  const id2 = generateSecureId()
  
  if (id1.length === 32 && id2.length === 32 && id1 !== id2) {
    console.log('   ✅ Secure ID generation working (32 chars, unique)')
    passed++
  } else {
    console.log('   ❌ Secure ID generation issue')
    failed++
  }

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`)
  
  if (failed > 0) {
    process.exit(1)
  }
  console.log('\n✅ All encryption tests passed!')
}

testEncryption()
