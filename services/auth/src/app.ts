import express from 'express';
import { authRouter } from './auth.controller';

export function createApp() {
    const app = express();
    app.use(express.json());

    app.use('/auth', authRouter);

    return app;
}