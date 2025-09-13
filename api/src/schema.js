// api/src/schema.js
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// eine Ebene hoch aus api/, dann config/form.schema.json
const schemaPath = resolve(__dirname, '../../config/form.schema.json');

// einmalig lesen & parsen
export const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));
