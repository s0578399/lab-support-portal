// app/src/lib/formSchema.ts
import { z, type ZodTypeAny } from 'zod';



/**
 * Option kann entweder ein einfacher String oder ein { value, label }-Objekt sein.
 * Der Renderer normalisiert beides; hier achten wir v. a. auf "value".
 */
type Option = string | { value: string; label: string };

/**
 * Feld-Definition aus dem JSON-Config.
 * - "requiredIf"/"showIf" erlauben dynamische Pflicht/Sichtbarkeit.
 * - "integer" schränkt number auf Ganzzahlen ein.
 */
type Field = {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'email' | 'url' | 'number' | 'select' | 'multiselect' | 'date' | 'file';
  required?: boolean;
  minLength?: number; // z. B. Description ≥ 20 Zeichen
  min?: number;
  max?: number;
  integer?: boolean;
  options?: Option[]; // für select/multiselect
  requiredIf?: { field: string; eq: string }; // dynamische Pflicht abhängig von anderem Feld
  showIf?: { field: string; eq: string }; // UI-Sichtbarkeit (nur Renderer-relevant)
};
type Category = { key: string; label: string; fields: Field[] };
type Config = { baseFields: Field[]; categories: Category[] };


/**
 * Hilfsfunktion: extrahiert die "value"-Strings und erzwingt min. 1 Option,
 * damit z.enum(...) einen nicht-leeren Tupel-Typ erhält.
 */
function toEnumValues(opts: Option[]): [string, ...string[]] {
  const vals = opts.map(o => typeof o === 'string' ? o : o.value);
  if (vals.length === 0) throw new Error('select requires options');
  return vals as [string, ...string[]];
}


/**
 * Mappt ein Field auf ein Zod-Schema.
 * Wichtig: Client-seitig validieren wir Strings (ggf. coercion) und überlassen
 * Datei- und Sicherheits-Checks dem Server.
 */

function zodForField(f: Field): ZodTypeAny {
  const s = z.string().trim(); // Basistyp für textuelle Felder
  switch (f.type) {
    case 'text':
    case 'textarea': return f.minLength ? s.min(f.minLength) : s;
    case 'email':    return z.string().trim().email();
    case 'url': {
    const base = z.string().trim().url();
    // Wenn Feld nicht required ist, erlaube auch den leeren String ("")
    return f.required ? base : z.union([z.literal(''), base]).optional();
    }
    case 'number': {
      // coerce.number → akzeptiert z. B. "42" und wandelt in number
      let num = z.coerce.number();
      if (f.integer) num = num.int();
      if (f.min !== undefined) num = num.min(f.min);
      if (f.max !== undefined) num = num.max(f.max);
      return num;
    }
    case 'select':      return z.enum(toEnumValues(f.options ?? []));
    case 'multiselect': return z.array(z.enum(toEnumValues(f.options ?? [])));
          // 💡 Falls "required" → min(1) später über applyRequired schwer abzubilden.
      //    Alternative: hier bei f.required → .min(1) ergänzen.
    case 'date':        return z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD');
    // ISO-Date-Only (YYYY-MM-DD). UI setzt type="date", daher passt String.

    case 'file':        return z.any(); // client: nur Präsenz prüfen; Server prüft Typ/Größe
    // Client: nur Präsenz prüfen. Typ/Größe prüft der Server.
      // RHF liefert typischerweise FileList | undefined → any ist hier ok.
    default:            return s;
  }
}

/**
 * Wendet required/optional auf ein Feldschema an.
 * Hinweis: Für Arrays (multiselect) erzwingt "required" nur "nicht undefined".
 * Mindestens ein Eintrag (Länge ≥ 1) müsstest du zusätzlich prüfen, falls gewünscht.
 */
function applyRequired(zf: ZodTypeAny, f: Field) {
  return f.required ? zf : zf.optional();
}


/**
 * Erzeugt ein client-seitiges Zod-Schema:
 * - Discriminated Union auf Basis des "category"-Werts → saubere Trennung je Kategorie.
 * - baseFields gelten für alle Kategorien, cat.fields sind kategoriespezifisch.
 * - superRefine implementiert "requiredIf" (kontextsensitive Pflichtprüfung).
 */
export function buildClientSchema(config: Config) {
  const unions = config.categories.map((cat) => {
    const shape: Record<string, ZodTypeAny> = {};
        // Gemeinsame Felder (für alle Kategorien)
    for (const f of config.baseFields) shape[f.name] = applyRequired(zodForField(f), f);
    // Kategorie-spezifische Felder
    for (const f of cat.fields)        shape[f.name] = applyRequired(zodForField(f), f);

     // Discriminator-Feld: fixiert auf cat.key
    shape['category'] = z.literal(cat.key);
    return z.object(shape).superRefine((val, ctx) => {
      // requiredIf: Wenn Bedingung erfüllt → Feld muss "belegt" sein.
      for (const f of cat.fields) {
        if (f.requiredIf) {
          const cond = val[f.requiredIf.field] === f.requiredIf.eq;
          if (cond) {
            const v: any = (val as any)[f.name];
            const missing = (Array.isArray(v) ? v.length === 0 : v === undefined || v === null || v === '');
            if (missing) ctx.addIssue({ code: z.ZodIssueCode.custom, path: [f.name], message: 'Pflichtfeld' });
          }
        }
      }
    });
  });
   // Discriminated Union über "category" liefert genau ein passendes Objekt je Kategorie.
  return z.discriminatedUnion('category', unions as any);
}


/**
 * Typableitung für Verbraucherseite.
 * Tipp: Häufig praktischer ist die "ausgewertete" Datengestalt:
 * export type ClientData = z.infer<ReturnType<typeof buildClientSchema>>;
 */
export type ClientSchemaType = ReturnType<typeof buildClientSchema>;
