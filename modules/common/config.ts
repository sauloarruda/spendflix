import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';

// Only load .env file in development or test environments
if (process.env.NODE_ENV !== 'production') {
  const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
  const envPath = resolve(__dirname, '../../config', envFile);
  loadEnv({ path: envPath });
}

const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_OFFLINE: process.env.IS_OFFLINE || 'false',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',

  COGNITO_USER_POOL_ID: process.env.COGNITO_USER_POOL_ID!,
  COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID!,
  COGNITO_ENDPOINT: process.env.COGNITO_ENDPOINT ? 'http://localhost:9229' : undefined,

  BASE_APP_URL: process.env.BASE_APP_URL || 'http://localhost:3000',
  ENCRYPTION_SECRET: process.env.ENCRYPTION_SECRET,
  DATABASE_URL: process.env.DATABASE_URL,
};

export default function getConfig() {
  return config;
}
