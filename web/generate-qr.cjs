// CIRO QR Code Generator — run: node generate-qr.cjs
const QRCode = require('qrcode')
const fs = require('fs')

const EXPO_URL = 'exp://192.168.1.100:8081'

async function main() {
  // SVG for submission
  await QRCode.toFile('ciro-app-qr.svg', EXPO_URL, {
    type: 'svg', width: 400, margin: 2,
    color: { dark: '#3b82f6', light: '#0a0f1e' },
    errorCorrectionLevel: 'H',
  })

  // PNG for README embed
  await QRCode.toFile('ciro-app-qr.png', EXPO_URL, {
    type: 'png', width: 400, margin: 2,
    color: { dark: '#3b82f6', light: '#0a0f1e' },
    errorCorrectionLevel: 'H',
  })

  // Print to terminal
  const term = await QRCode.toString(EXPO_URL, { type: 'terminal', small: true })
  console.log('\n\n📱  CIRO Mobile App — Expo Go QR Code\n')
  console.log(term)
  console.log('Scan URL:', EXPO_URL)
  console.log('\nFiles saved: ciro-app-qr.svg  &  ciro-app-qr.png')
  console.log('\n── HOW TO USE ─────────────────────────────────────')
  console.log('1. Run web app:    cd web  &&  npm run dev')
  console.log('2. Run mobile:     cd mobile  &&  npx expo start')
  console.log('3. Scan QR from Expo Go (same WiFi)')
  console.log('────────────────────────────────────────────────────\n')
}

main().catch(console.error)
