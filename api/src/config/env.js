import 'dotenv/config';

export const config = {
  smtpHost: process.env.SMTP_HOST ?? 'localhost',
  smtpPort: Number(process.env.SMTP_PORT ?? 1025),
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  fromAddr: process.env.FROM_ADDR ?? 'test@example.local',
  ticketInbox: process.env.TICKET_EINGANG ?? 'test@example.local'
};
