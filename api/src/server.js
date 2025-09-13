import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import multer from 'multer';

import { schema } from './schema.js';
import { buildServerSchema, requiredUploadsForCategory } from './schemaBuilder.js';
import { sendTicketMail } from './services/mailService.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const ticketSchema = buildServerSchema(schema);

export function createServer() {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: ['http://localhost:5173'] }));
  app.use(express.json({ limit: '1mb' }));
  app.use(rateLimit({ windowMs: 60_000, max: 60, standardHeaders: true, legacyHeaders: false }));

  app.get('/health', (_req, res) => res.json({ ok: true }));

  app.post('/api/tickets', async (req, res) => {
    const isMultipart = (req.headers['content-type'] || '').includes('multipart/form-data');
    if (isMultipart) {
      await new Promise((resolve, reject) =>
        upload.any()(req, res, (err) => (err ? reject(err) : resolve(null)))
      );
    }

    // Normalisierung gemäß JSON-Schema
    for (const f of schema.categories.flatMap((c) => c.fields)) {
      if (f.type === 'multiselect' && typeof req.body?.[f.name] === 'string') {
        req.body[f.name] = req.body[f.name].split(',').map(s => s.trim()).filter(Boolean);
      }
      if (f.type === 'number' && typeof req.body?.[f.name] === 'string') {
        req.body[f.name] = Number(req.body[f.name]);
      }
    }

    const parsed = ticketSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid Input', details: parsed.error.flatten() });
    }

    const requiredUploads = requiredUploadsForCategory(schema, parsed.data.category);
    if (requiredUploads.length) {
      if (!isMultipart) {
        return res.status(400).json({
          error: 'Invalid Input',
          details: { fieldErrors: Object.fromEntries(requiredUploads.map(n => [n, ['Datei erforderlich']])), formErrors: [] }
        });
      }
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
      await sendTicketMail(parsed.data, req.files || []);
      return res.status(200).json({ ok: true });
    } catch {
      return res.status(502).json({ error: 'Mail Failed' });
    }
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => res.status(500).json({ error: 'Unexpected' }));
  return app;
}
