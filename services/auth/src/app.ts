import express from 'express';
import path from 'path';
import { middleware as OpenApiMiddleware } from 'express-openapi-validator';
import authRouter from './controller/auth.controller';

export default function createApp() {
  const app = express();

  app.use(express.json());
  app.use(
    OpenApiMiddleware({
      apiSpec: 'openapi.yaml',
      validateRequests: true,
      validateResponses: true,
    }),
  );
  app.use(
    (
      err: { status?: number; message: string; errors?: unknown },
      req: express.Request,
      res: express.Response,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _next: express.NextFunction,
    ) => {
      // console.error(err);
      res.status(err.status || 500).json({
        message: err.message,
        errors: err.errors,
      });
    },
  );

  app.use('/auth', authRouter);

  app.get('/docs/openapi.yaml', (req, res) => {
    res.sendFile(path.join(__dirname, '../openapi.yaml'));
  });
  app.get('/docs', (req, res) => {
    res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <title>Spendflix API Docs</title>
              <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css">
            </head>
            <body>
              <div id="swagger-ui"></div>
              <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
              <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-standalone-preset.js"></script>
              <script>
                window.onload = function() {
                  SwaggerUIBundle({
                    url: 'docs/openapi.yaml',
                    dom_id: '#swagger-ui',
                    presets: [
                      SwaggerUIBundle.presets.apis,
                      SwaggerUIStandalonePreset
                    ],
                    layout: "BaseLayout",
                    deepLinking: true
                  });
                };
              </script>
            </body>
            </html>
        `);
  });

  return app;
}
