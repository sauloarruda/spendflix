const { PrismaPlugin } = require('@prisma/nextjs-monorepo-workaround-plugin');

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
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.plugins = [...config.plugins, new PrismaPlugin()];
    }

    return config;
  },
};

module.exports = nextConfig;
