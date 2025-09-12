import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import ticketRoutes from './routes/tickets.js';

export function createServer() {
  const app = express();

  // Sicherheit & Basis
  app.use(helmet());
  app.use(cors({ origin: true }));  // im Intranet evtl. enger fassen
  app.use(express.json({ limit: '6mb' }));
  app.use(rateLimit({ windowMs: 60_000, max: 60 }));

  // Healthcheck
  app.get('/health', (_req, res) => res.json({ ok: true }));

  // Ticket-Routen
  app.use('/api', ticketRoutes);

  return app;
}
