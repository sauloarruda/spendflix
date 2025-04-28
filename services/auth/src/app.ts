import express from 'express';
import { authRouter } from './auth.controller';
import path from 'path';

export function createApp() {
    const app = express();

    app.use(express.json());
    app.use('/auth', authRouter);


    // Serve apenas a API spec (openapi.yaml)
    app.get('/docs/openapi.yaml', (req, res) => {
        res.sendFile(path.join(__dirname, '../openapi.yaml'));
    });

    // Serve a interface Swagger UI usando assets da CDN
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