const path = require('path');

module.exports = {
  webpack(config) {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      // alias your swagger-generated types
      'types/api': path.resolve(__dirname, 'types/api'),
    };
    return config;
  },
  env: {
    NEXT_PUBLIC_API_AUTH_URL: process.env.NEXT_PUBLIC_API_AUTH_URL,
  },
};
