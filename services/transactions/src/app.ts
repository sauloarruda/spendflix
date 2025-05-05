import express from 'express';

export default function createApp() {
  const app = express();

  app.use(express.json());

  return app;
}
