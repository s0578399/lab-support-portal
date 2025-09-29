import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import multer from 'multer';

import { schema } from './schema.js';
import { buildServerSchema, requiredUploadsForCategory } from './schemaBuilder.js';
import { sendTicketMail } from './services/mailService.js';


// Multer für Datei-Uploads (Memory Storage, Limit: 10MB pro Datei)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Server-seitiges Validierungsschema (Zod → JSON-Schema erweitert)
const ticketSchema = buildServerSchema(schema);

export function createServer() {
  const app = express();

  // Sicherheits-Header (Helmet)
  app.use(helmet());


  // --- CORS ---
  const defaultAllowed = [
    'http://localhost',
    'http://localhost:80',
    'http://localhost:3000',
    'http://127.0.0.1',
    'http://127.0.0.1:3000',
    'http://it-service-wi-test.f4.htw-berlin.de',
  ];

  const envAllowed = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const allowedOrigins = Array.from(new Set([...defaultAllowed, ...envAllowed]));

  // Dynamischer Origin-Check (empfohlen, statt "*")
  const corsOptions = {
    origin: function (origin, callback) {
      // erlauben bei: no-origin (z.B. curl/Postman) oder in Liste
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-Request-ID'],
    credentials: false, // kein Cookie-Auth im MVP
    optionsSuccessStatus: 204,
  };

  app.use(cors(corsOptions));

  // JSON-Parsing mit Payload-Limit (1MB)
  // --- Body parsing ---
  app.use(express.json({ limit: '100kb' }));

   // Rate-Limiting: max. 60 Requests pro Minute pro IP
  app.use(rateLimit({ windowMs: 60_000, max: 60, standardHeaders: true, legacyHeaders: false }));

   // Health-Check-Endpoint für Monitoring/Load-Balancer
  app.get('/health', (_req, res) => res.status(200).send('ok'));


  // Ticket-Erstellung
  app.post('/api/tickets', async (req, res) => {
    const isMultipart = (req.headers['content-type'] || '').includes('multipart/form-data');

    // Falls Multipart: Uploads mit Multer parsen
    if (isMultipart) {
      await new Promise((resolve, reject) =>
        upload.any()(req, res, (err) => (err ? reject(err) : resolve(null)))
      );
    }

    // Eingaben normalisieren (Strings → Arrays / Numbers)
    for (const f of schema.categories.flatMap((c) => c.fields)) {
      if (f.type === 'multiselect' && typeof req.body?.[f.name] === 'string') {
        req.body[f.name] = req.body[f.name].split(',').map(s => s.trim()).filter(Boolean);
      }
      if (f.type === 'number' && typeof req.body?.[f.name] === 'string') {
        req.body[f.name] = Number(req.body[f.name]);
      }

      // NEU: Leere Strings bei nicht-pflichtigen String-Feldern entfernen
      if (
        !f.required &&
        ['text', 'textarea', 'email', 'url', 'date'].includes(f.type) &&
        req.body?.[f.name] === ''
      ) {
        delete req.body[f.name]; // oder: req.body[f.name] = undefined;
      }
    }

    // Validierung gegen Schema (Zod)
    const parsed = ticketSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid Input', details: parsed.error.flatten() });
    }

    // Prüfen, ob für die gewählte Kategorie bestimmte Uploads Pflicht sind
    const requiredUploads = requiredUploadsForCategory(schema, parsed.data.category);
    if (requiredUploads.length) {
      if (!isMultipart) {
        // Fehler, wenn Dateien fehlen, aber kein Multipart-Request geschickt wurde
        return res.status(400).json({
          error: 'Invalid Input',
          details: { fieldErrors: Object.fromEntries(requiredUploads.map(n => [n, ['Datei erforderlich']])), formErrors: [] }
        });
      }

      // Check: Sind alle Pflicht-Uploads tatsächlich dabei?
      const all = Array.isArray(req.files) ? req.files : Object.values(req.files || {}).flat();
      const missing = {};
      for (const name of requiredUploads) {
        const has = (all || []).some(f => f.fieldname === name);
        if (!has) missing[name] = ['Datei erforderlich'];
      }
      if (Object.keys(missing).length) {
        return res.status(400).json({ error: 'Invalid Input', details: { fieldErrors: missing, formErrors: [] } });
      }
    }

    try {

      // Mail mit Ticket-Inhalt und evtl. Uploads verschicken
      await sendTicketMail(parsed.data, req.files || []);
      return res.status(200).json({ ok: true });
    } catch {
       // Fehler beim Mailversand → 502 (Bad Gateway)
      return res.status(502).json({ error: 'Mail Failed' });
    }
  });

  // Globale Fehlerbehandlung: Fängt alle nicht behandelten Errors ab
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => res.status(500).json({ error: 'Unexpected' }));
  return app;
}
