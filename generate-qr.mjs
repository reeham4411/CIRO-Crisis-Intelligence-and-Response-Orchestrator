/**
 * CIRO QR Code Generator
 * Generates a QR code linking to the Expo Go app deep link
 * Run: node generate-qr.mjs
 */
import QRCode from 'qrcode'
import { createWriteStream } from 'fs'

// Expo Go deep link — change IP to your local machine IP
const EXPO_URL = 'exp://192.168.1.100:8081'
const OUTPUT_SVG = 'ciro-app-qr.svg'
const OUTPUT_TXT = 'ciro-app-qr.txt'

async function main() {
  // Generate SVG QR (for README / submission)
  await QRCode.toFile(OUTPUT_SVG, EXPO_URL, {
    type: 'svg',
    width: 400,
    margin: 2,
    color: { dark: '#3b82f6', light: '#0a0f1e' },
    errorCorrectionLevel: 'H',
  })
  console.log(`✅ SVG QR saved → ${OUTPUT_SVG}`)

  // Generate terminal QR
  const term = await QRCode.toString(EXPO_URL, { type: 'terminal', small: true })
  console.log('\n📱 CIRO Mobile App QR Code:')
  console.log(term)
  console.log(`\nScan with Expo Go to open: ${EXPO_URL}`)
  console.log('\n⚠️  Make sure:')
  console.log('  1. Web app is running: cd web && npm run dev')
  console.log('  2. Mobile: cd mobile && npx expo start')
  console.log('  3. Phone and PC on same WiFi network')
}

main().catch(console.error)
