import nodemailer from 'nodemailer';
import { config } from '../config/env.js';

const transporter = nodemailer.createTransport({
  host: config.smtpHost,
  port: config.smtpPort,
  secure: false,
  auth: config.smtpUser ? { user: config.smtpUser, pass: config.smtpPass } : undefined
});

export async function sendTicketMail(ticketType, payload, attachments) {
  const subject = `[Ticket] ${ticketType}`;
  const html = `<h3>${subject}</h3><pre>${escapeHtml(JSON.stringify(payload, null, 2))}</pre>`;

  const info = await transporter.sendMail({
    from: config.fromAddr,
    to: config.ticketInbox,
    subject,
    html,
    text: JSON.stringify(payload, null, 2),
    attachments: attachments.map(a => ({
      filename: a.name,
      content: Buffer.from(a.base64, 'base64'),
      contentType: a.mime
    }))
  });

  return info.messageId;
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, m => (
    { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[m]
  ));
}
