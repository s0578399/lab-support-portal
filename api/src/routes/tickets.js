import { Router } from 'express';
import { z } from 'zod';
import { sendTicketMail } from '../services/mailService.js';

const router = Router();

const Attachment = z.object({
  name: z.string(),
  mime: z.string().default('application/octet-stream'),
  base64: z.string()
});

const TicketRequest = z.object({
  ticketType: z.string(),
  payload: z.record(z.any()),
  attachments: z.array(Attachment).optional()
});

router.post('/send-ticket', async (req, res) => {
  const parsed = TicketRequest.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid request', details: parsed.error.format() });
  }

  try {
    const { ticketType, payload, attachments = [] } = parsed.data;
    const messageId = await sendTicketMail(ticketType, payload, attachments);
    res.json({ ok: true, messageId });
  } catch (e) {
    console.error('❌ Mail error', e);
    res.status(502).json({ error: 'Mail gateway failure' });
  }
});

export default router;
