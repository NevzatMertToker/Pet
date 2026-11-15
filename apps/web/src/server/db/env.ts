/**
 * Komut satırı betikleri (migrate, seed...) Next.js dışında çalıştığı için
 * .env dosyalarını kendileri yükler. Zaten tanımlı değişkenler ezilmez.
 */
for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file);
  } catch {
    // dosya yoksa sorun değil
  }
}
