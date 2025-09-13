import nodemailer from 'nodemailer';
import { schema } from '../schema.js';

// === Transport-Konfiguration ===
// Erstellt ein Nodemailer-Transport-Objekt basierend auf Umgebungsvariablen.
// - Standard: MailHog (localhost:1025, kein Auth)
// - Produktion: Uni-SMTP mit USER/PASS
function transport() {
  const host = process.env.SMTP_HOST ?? '127.0.0.1';
  const port = Number(process.env.SMTP_PORT ?? 1025);
  const secure = String(process.env.SMTP_SECURE ?? 'false') === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  return nodemailer.createTransport({ host, port, secure, auth: user && pass ? { user, pass } : undefined });
}

// === Hilfsfunktionen ===

// Liefert die Konfigurationsdefinition (aus form.schema.json) für eine bestimmte Kategorie.
function getCategoryDef(catKey) { return schema.categories.find(c => c.key === catKey); }

// Wandelt Optionslisten in einheitliche {value,label}-Objekte um.
// (Felder können im JSON als String[] oder Objekte definiert sein.)
function normalizeOptions(options = []) { return options.map(o => (typeof o === 'string' ? { value: o, label: o } : o)); }
// Sucht zu einem gespeicherten Wert (z. B. "low") das passende Label ("niedrig").
function optionLabel(field, value) {
  const hit = normalizeOptions(field.options || []).find(o => o.value === value);
  return hit ? hit.label : value;
}

// Formatiert Feldwerte je nach Typ für die Ausgabe im Mail-Text.
// - select/multiselect: zeigen die Labels, nicht nur die Rohwerte
// - andere Felder: als String
function formatValueByType(field, value) {
  if (value == null) return '-';
  switch (field.type) {
    case 'select':      return optionLabel(field, value);
    case 'multiselect': return Array.isArray(value) ? value.map(v => optionLabel(field, v)).join(', ') : String(value);
    default:            return String(value);
  }
}

// Erstellt den Betreff der Mail.
// - Nutzt ein Template aus der Kategorie, globales Schema oder Default
// - Platzhalter {category}, {subject}, ... werden durch Werte ersetzt
function buildSubject(data, catDef) {
  const template = catDef?.subjectTemplate || schema.subjectTemplate || '[Ticket] {category} – {subject}';
  return template.replace(/\{(\w+)\}/g, (_m, key) => String(data[key] ?? ''));
}

// Baut den eigentlichen Mail-Body (Plaintext).
// Enthält:
// - Kategorie + Zeitstempel
// - Basisfelder (aus schema.baseFields)
// - Kategorien-spezifische Felder
// - Berücksichtigung von showIf / requiredIf
// - Am Ende: Meta-Infos wie App-Version
function buildBody(data, catDef) {
  const lines = [];
  lines.push(`Kategorie: ${catDef?.label ?? data.category}`, `Zeitstempel: ${new Date().toISOString()}`, '');

  // Basisfelder
  if (Array.isArray(schema.baseFields)) {
    for (const f of schema.baseFields) {
      if (f.type === 'file') continue;   // Datei-Felder nicht in Text
      const val = formatValueByType(f, data[f.name]);
      const skipEmpty = (val === '' || val === '-') && !f.required;
      if (!skipEmpty) lines.push(`${f.label}: ${val}`);
    }
  }
  lines.push('');

  // Kategorie-Felder
  for (const f of catDef.fields) {
    if (f.type === 'file') continue;
    // showIf: nur anzeigen, wenn Bedingung erfüllt
    if (f.showIf) {
      const condVal = data[f.showIf.field];
      if (condVal !== f.showIf.eq) continue;
    }
    const val = formatValueByType(f, data[f.name]);
    const skipEmpty = (val === '' || val === '-') && !f.required && !f.requiredIf;
    if (!skipEmpty) lines.push(`${f.label}: ${val}`);
  }

   // Meta-Infos
  lines.push('', 'Meta:', `  App-Version: ${process.env.APP_VERSION ?? 'dev'}`);
  return lines.join('\n');
}

// Sammelt Datei-Anhänge für die Mail.
// - schaut in der Kategorie nach allen Feldern mit type=file
// - filtert die hochgeladenen Dateien entsprechend
// - baut Nodemailer-Attachment-Objekte ({filename, content})
function collectAttachments(catDef, files) {
  const fileFieldNames = catDef.fields.filter(f => f.type === 'file').map(f => f.name);
  const all = Array.isArray(files) ? files : Object.values(files || {}).flat();
  return (all || [])
    .filter(f => fileFieldNames.includes(f.fieldname))
    .map(f => ({ filename: f.originalname, content: f.buffer }));
}


// === Hauptfunktion ===
// Baut und verschickt die Support-Mail für ein Ticket.
// - Stellt SMTP-Transport her
// - Ermittelt Absender/Empfänger
// - Baut Subject, Body, Attachments
// - Übergibt alles an Nodemailer
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
