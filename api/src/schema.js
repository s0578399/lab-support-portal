
import { readFileSync, existsSync } from 'node:fs';    
import path from 'node:path';                             
import { fileURLToPath } from 'node:url';                  

//! __dirname für ESM
const __filename = fileURLToPath(import.meta.url);        
const __dirname = path.dirname(__filename);                

// 1) optionaler Override via Env (praktisch für Tests/CI)
const overridePath = process.env.FORM_SCHEMA_PATH
  ? path.resolve(process.env.FORM_SCHEMA_PATH)
  : null;                                               
// 2) Standard-Suchreihenfolge (robust bei verschiedenen Start-Dirs)
const candidates = [
  overridePath,
  path.resolve(__dirname, '../../config/form.schema.json'), // api/src -> ../../config
  path.resolve(process.cwd(), '../config/form.schema.json'),// falls aus api/ gestartet
  path.resolve(process.cwd(), 'config/form.schema.json'),   // falls aus Repo-Root gestartet
].filter(Boolean);                                          
let schemaFile = null;                                     
for (const p of candidates) {                             
  if (existsSync(p)) { schemaFile = p; break; }             
}                                                           

if (!schemaFile) {                                          
  throw new Error(`form.schema.json nicht gefunden. Versuchte Pfade:\n${candidates.join('\n')}`); 
}                                                           

export const schema = JSON.parse(readFileSync(schemaFile, 'utf-8')); 
