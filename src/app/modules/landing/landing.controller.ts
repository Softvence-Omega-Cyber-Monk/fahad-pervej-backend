import { Request, Response } from "express";

export const landingPage = (_req: Request, res: Response) => {
  res.status(200).send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MDItems API Server</title>
  <style>
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Ubuntu;
      background: linear-gradient(135deg, #0f2027, #203a43, #2c5364);
      color: #ffffff;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      max-width: 900px;
      padding: 48px;
      background: rgba(0, 0, 0, 0.35);
      border-radius: 16px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
    }
    h1 {
      font-size: 2.6rem;
      margin-bottom: 12px;
    }
    p {
      font-size: 1.1rem;
      line-height: 1.7;
      opacity: 0.95;
    }
    .badge {
      display: inline-block;
      margin-top: 12px;
      padding: 6px 14px;
      font-size: 0.85rem;
      border-radius: 999px;
      background: #22c55e;
      color: #062e1a;
      font-weight: 600;
    }
    .links {
      margin-top: 32px;
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }
    .links a {
      text-decoration: none;
      color: #ffffff;
      padding: 12px 22px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.2);
      transition: all 0.25s ease;
    }
    .links a:hover {
      background: #ffffff;
      color: #0f2027;
    }
    .footer {
      margin-top: 40px;
      font-size: 0.9rem;
      opacity: 0.7;
    }
    code {
      background: rgba(255, 255, 255, 0.15);
      padding: 4px 8px;
      border-radius: 6px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>MDItems – Multivendor Medicine API</h1>
    <span class="badge">Server Running</span>

    <p>
      Backend service for the <strong>MDItems Multivendor Medicine Platform</strong>.
      Provides secure REST APIs for users, products, orders, payments, shipments,
      wallets, CMS, and more.
    </p>

    <p>
      API base path:
      <br />
      <code>/api/v1/*</code>
    </p>

    <div class="links">
      <a href="/api-docs" target="_blank">📘 API Documentation</a>
      <a href="/health" target="_blank">🩺 Health Check</a>
    </div>

    <div class="footer">
      © ${new Date().getFullYear()} MDItems • Express + TypeScript
    </div>
  </div>
</body>
</html>
  `);
};
