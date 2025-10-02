//NEU!
import { readFileSync, existsSync } from 'node:fs';        //NEU!
import path from 'node:path';                               //NEU!
import { fileURLToPath } from 'node:url';                   //NEU!

//NEU! __dirname für ESM
const __filename = fileURLToPath(import.meta.url);          //NEU!
const __dirname = path.dirname(__filename);                 //NEU!

//NEU! 1) optionaler Override via Env (praktisch für Tests/CI)
const overridePath = process.env.FORM_SCHEMA_PATH
  ? path.resolve(process.env.FORM_SCHEMA_PATH)
  : null;                                                  //NEU!

//NEU! 2) Standard-Suchreihenfolge (robust bei verschiedenen Start-Dirs)
const candidates = [
  overridePath,
  path.resolve(__dirname, '../../config/form.schema.json'), // api/src -> ../../config
  path.resolve(process.cwd(), '../config/form.schema.json'),// falls aus api/ gestartet
  path.resolve(process.cwd(), 'config/form.schema.json'),   // falls aus Repo-Root gestartet
].filter(Boolean);                                          //NEU!

let schemaFile = null;                                      //NEU!
for (const p of candidates) {                               //NEU!
  if (existsSync(p)) { schemaFile = p; break; }             //NEU!
}                                                           //NEU!

if (!schemaFile) {                                          //NEU!
  throw new Error(`form.schema.json nicht gefunden. Versuchte Pfade:\n${candidates.join('\n')}`); //NEU!
}                                                           //NEU!

export const schema = JSON.parse(readFileSync(schemaFile, 'utf-8')); //NEU!
