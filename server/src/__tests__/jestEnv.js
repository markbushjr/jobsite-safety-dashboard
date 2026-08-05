// Runs before each test file's module code executes. The app reads
// JWT_SECRET at request-time (not at import-time), but we set it here
// regardless so no test depends on a real .env file existing.
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-do-not-use-in-production";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";
