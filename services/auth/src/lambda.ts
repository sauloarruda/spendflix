import serverless from 'serverless-http';
import createApp from './app';

const app = createApp();

// eslint-disable-next-line import/prefer-default-export
export const handler = serverless(app);
