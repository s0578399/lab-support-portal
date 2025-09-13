// api/src/schema.js
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';


// __filename und __dirname nachbilden (ESM hat das nicht nativ)
// → wir brauchen das, um den Pfad zur config-Datei korrekt zu bestimmen
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// eine Ebene hoch aus api/, dann config/form.schema.json
const schemaPath = resolve(__dirname, '../../config/form.schema.json');

// JSON-Schema einmalig einlesen und parsen
// - Enthält alle Basisfelder und Kategorien
// - Wird von Server-Logik (Validation, Mail) und Client gleichermaßen genutzt
export const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));
