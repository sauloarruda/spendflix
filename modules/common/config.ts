let config: Record<string, string | undefined>;

// eslint-disable-next-line max-lines-per-function
export default function getConfig() {
  if (!config) {
    config = {
      NODE_ENV: process.env.NODE_ENV ?? 'development',
      IS_OFFLINE: process.env.IS_OFFLINE ?? 'false',
      LOG_LEVEL: process.env.LOG_LEVEL ?? 'debug',

      COGNITO_USER_POOL_ID: process.env.COGNITO_USER_POOL_ID!,
      COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID!,
      COGNITO_ENDPOINT: !process.env.COGNITO_ENDPOINT
        ? 'http://localhost:9229'
        : process.env.COGNITO_ENDPOINT,

      BASE_APP_URL: process.env.BASE_APP_URL ?? 'http://localhost:3000',
      ENCRYPTION_SECRET: process.env.ENCRYPTION_SECRET,
      DATABASE_URL: process.env.DATABASE_URL,

      S3_ENDPOINT: process.env.S3_ENDPOINT,
      S3_KEY: process.env.S3_KEY,
      S3_SECRET: process.env.S3_SECRET,
      S3_BUCKET: process.env.S3_BUCKET,
      S3_REGION: process.env.S3_REGION,
    };
    // console.log(config);
  }
  return config;
}
