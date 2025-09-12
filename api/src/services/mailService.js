import nodemailer from 'nodemailer';

function getTransport() {
  const host = process.env.SMTP_HOST ?? '127.0.0.1';
  const port = Number(process.env.SMTP_PORT ?? 1025);
  const secure = String(process.env.SMTP_SECURE ?? 'false') === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  return nodemailer.createTransport({
    host, port, secure,
    auth: user && pass ? { user, pass } : undefined
  });
}

export async function sendTicketMail(data) {
  const transporter = getTransport();
  const from = process.env.FROM_ADDR ?? 'tickets@hochschule.local';
  const to   = process.env.TICKET_EINGANG ?? 'ticketsystem@hochschule.local';

  const subject = `[Ticket] ${data.category} – ${data.subject} (Urgency: ${data.urgency})`;
  const text = [
    `Name: ${data.name}`,
    `E-Mail: ${data.email}`,
    `Kategorie: ${data.category}`,
    `Priorität: ${data.urgency}`,
    `Betreff: ${data.subject}`,
    '',
    'Beschreibung:',
    data.description
  ].join('\n');

  return transporter.sendMail({ from, to, subject, text });
}
