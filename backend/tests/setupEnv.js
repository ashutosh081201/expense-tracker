// Test-only environment. Never points at the real database,
// mail account or Gemini key from .env.
process.env.JWT_SECRET = "test-jwt-secret";
process.env.GEMINI_API_KEY = "test-gemini-key";
process.env.GMAIL_USER = "test@example.com";
process.env.GMAIL_APP_PASSWORD = "test";
