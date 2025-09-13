import nodemailer from 'nodemailer';
import { schema } from '../schema.js';

function transport() {
  const host = process.env.SMTP_HOST ?? '127.0.0.1';
  const port = Number(process.env.SMTP_PORT ?? 1025);
  const secure = String(process.env.SMTP_SECURE ?? 'false') === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  return nodemailer.createTransport({ host, port, secure, auth: user && pass ? { user, pass } : undefined });
}

function getCategoryDef(catKey) { return schema.categories.find(c => c.key === catKey); }
function normalizeOptions(options = []) { return options.map(o => (typeof o === 'string' ? { value: o, label: o } : o)); }
function optionLabel(field, value) {
  const hit = normalizeOptions(field.options || []).find(o => o.value === value);
  return hit ? hit.label : value;
}
function formatValueByType(field, value) {
  if (value == null) return '-';
  switch (field.type) {
    case 'select':      return optionLabel(field, value);
    case 'multiselect': return Array.isArray(value) ? value.map(v => optionLabel(field, v)).join(', ') : String(value);
    default:            return String(value);
  }
}
function buildSubject(data, catDef) {
  const template = catDef?.subjectTemplate || schema.subjectTemplate || '[Ticket] {category} – {subject}';
  return template.replace(/\{(\w+)\}/g, (_m, key) => String(data[key] ?? ''));
}
function buildBody(data, catDef) {
  const lines = [];
  lines.push(`Kategorie: ${catDef?.label ?? data.category}`, `Zeitstempel: ${new Date().toISOString()}`, '');

  if (Array.isArray(schema.baseFields)) {
    for (const f of schema.baseFields) {
      if (f.type === 'file') continue;
      const val = formatValueByType(f, data[f.name]);
      const skipEmpty = (val === '' || val === '-') && !f.required;
      if (!skipEmpty) lines.push(`${f.label}: ${val}`);
    }
  }
  lines.push('');
  for (const f of catDef.fields) {
    if (f.type === 'file') continue;
    if (f.showIf) {
      const condVal = data[f.showIf.field];
      if (condVal !== f.showIf.eq) continue;
    }
    const val = formatValueByType(f, data[f.name]);
    const skipEmpty = (val === '' || val === '-') && !f.required && !f.requiredIf;
    if (!skipEmpty) lines.push(`${f.label}: ${val}`);
  }
  lines.push('', 'Meta:', `  App-Version: ${process.env.APP_VERSION ?? 'dev'}`);
  return lines.join('\n');
}
function collectAttachments(catDef, files) {
  const fileFieldNames = catDef.fields.filter(f => f.type === 'file').map(f => f.name);
  const all = Array.isArray(files) ? files : Object.values(files || {}).flat();
  return (all || [])
    .filter(f => fileFieldNames.includes(f.fieldname))
    .map(f => ({ filename: f.originalname, content: f.buffer }));
}

export async function sendTicketMail(data, files = {}) {
  const tr = transport();
  const from = process.env.FROM_ADDR ?? 'tickets@hochschule.local';
  const to   = process.env.TICKET_EINGANG ?? 'ticketsystem@hochschule.local';
  const catDef = getCategoryDef(data.category);
  const subject = buildSubject(data, catDef);
  const text = buildBody(data, catDef);
  const attachments = collectAttachments(catDef, files);
  return tr.sendMail({ from, to, subject, text, attachments });
}
