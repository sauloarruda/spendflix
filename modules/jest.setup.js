// Set default test environment variables if not already set
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || 'test-encryption-secret';
process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'fatal';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/spendflix_test';
