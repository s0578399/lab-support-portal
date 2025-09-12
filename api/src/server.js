// api/src/server.js
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import { ticketSchema } from './validation/validation.js';
import { sendTicketMail } from './services/mailService.js';

/**
 * Erstellt und konfiguriert die Express-App.
 * Das eigentliche Listen (app.listen) passiert in src/index.js,
 * damit die App testbar bleibt.
 */
export function createServer() {
  const app = express();

  // ── Security & Basics
  app.use(helmet());
  app.use(express.json({ limit: '100kb' }));

  // CORS: im Dev reicht meist localhost:5173 (Vite)
  app.use(
    cors({
      origin: ['http://localhost:5173'],
      methods: ['GET', 'POST', 'OPTIONS'],
    })
  );

  // Rate-Limit: 60 Requests / Minute / IP
  app.use(
    rateLimit({
      windowMs: 60_000,
      max: 60,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  // ── Routen

  // Healthcheck (für schnelle „lebt der Prozess?“ Abfragen)
  app.get('/health', (_req, res) => res.json({ ok: true }));

  // Ticket-Erstellung (MVP)
  app.post('/api/tickets', async (req, res) => {
    // Eingaben serverseitig validieren
    const parsed = ticketSchema.safeParse(req.body);
    if (!parsed.success) {
      // Optional fürs Debuggen:
      // console.warn('Zod:', parsed.error.flatten());
      return res
        .status(400)
        .json({ error: 'Invalid Input', details: parsed.error.flatten() });
    }

    try {
      // E-Mail versenden (MailHog im Dev)
      await sendTicketMail(parsed.data);
      return res.status(200).json({ ok: true });
    } catch (err) {
      // SMTP/Transport-Fehler → 502
      // Optional fürs Debuggen:
      // console.error('Mail send failed:', err);
      return res.status(502).json({ error: 'Mail Failed' });
    }
  });

  // ── Fallback-Error-Handler (unerwartete Fehler → 500)
  // (Express 5 nutzt next(err) weiterhin)
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    // Optional: detaillierter loggen
    // console.error('Unexpected error:', err);
    res.status(500).json({ error: 'Unexpected' });
  });

  return app;
}
