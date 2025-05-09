/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  compiler: {
    styledComponents: true,
  },
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    COGNITO_ENDPOINT: process.env.COGNITO_ENDPOINT,
    COGNITO_USER_POOL_ID: process.env.COGNITO_USER_POOL_ID,
    COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID,
    LOG_LEVEL: process.env.LOG_LEVEL,
  },
  output: 'standalone',
  experimental: {
    outputFileTracingRoot: process.env.VERCEL ? undefined : process.cwd(),
  },
};

module.exports = nextConfig;
