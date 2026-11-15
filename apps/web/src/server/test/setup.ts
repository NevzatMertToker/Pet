/**
 * Servis testleri gerçek bir PostgreSQL üzerinde çalışır (stok kilitleri ve
 * transaction davranışı taklit edilemez). Geliştirme verisine dokunmamak için
 * ayrı bir veritabanı kullanılır.
 */
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgres://patipaket:patipaket@localhost:5432/patipaket_test";
process.env.AUTH_SECRET = "test-secret-test-secret-test-secret-test-secret";
process.env.PAYMENT_PROVIDER = "mock";
