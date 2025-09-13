import { Router } from 'express';
import { z } from 'zod';
import { sendTicketMail } from '../services/mailService.js';

const router = Router();

// === Zod-Schemas ===
// Definiert die Struktur eines einzelnen Dateianhangs, wie er im Request übertragen wird.
// - name: Dateiname
// - mime: MIME-Type, Default 'application/octet-stream' wenn nicht angegeben
// - base64: Dateiinhalt als Base64-codierter String
const Attachment = z.object({
  name: z.string(),
  mime: z.string().default('application/octet-stream'),
  base64: z.string()
});

// Definiert die Struktur der gesamten Ticket-Anfrage.
// - ticketType: Art des Tickets (z. B. "Procurement", "SoftwareInstall")
// - payload: eigentliche Formular-Daten, flexibel als Key-Value (record)
// - attachments: optionale Liste von Dateianhängen
const TicketRequest = z.object({
  ticketType: z.string(),
  payload: z.record(z.any()),
  attachments: z.array(Attachment).optional()
});


// === POST /send-ticket ===
// Nimmt eine Ticket-Anfrage entgegen, validiert sie, und verschickt sie per Mail.
router.post('/send-ticket', async (req, res) => {
   // 1) Request-Body gegen das Zod-Schema prüfen
  const parsed = TicketRequest.safeParse(req.body);
  if (!parsed.success) {
    // Bei Fehler: 400 Bad Request + detaillierte Fehlermeldungen
    return res.status(400).json({ error: 'Invalid request', details: parsed.error.format() });
  }

  try {
    // 2) Daten extrahieren (mit Defaults aus Zod)
    const { ticketType, payload, attachments = [] } = parsed.data;

     // 3) Mail-Service aufrufen
    // Erwartet: Kategorie (ticketType), Formular-Daten (payload), Attachments
    const messageId = await sendTicketMail(ticketType, payload, attachments);
    // 4) Erfolg: Mail-ID zurückgeben
    res.json({ ok: true, messageId });
  } catch (e) {
    // Falls SMTP / Mail-Service fehlschlägt
    console.error('❌ Mail error', e);
    res.status(502).json({ error: 'Mail gateway failure' });
  }
});

export default router;
