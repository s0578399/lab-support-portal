// api/src/schemaBuilder.js
import { z } from 'zod';

function toEnumValues(opts = []) {
  const vals = opts.map((o) => (typeof o === 'string' ? o : o.value));
  if (!vals.length) throw new Error('select requires options');
  return vals;
}

function zodForField(f) {
  const s = z.string().trim();
  switch (f.type) {
    case 'text':
    case 'textarea': return f.minLength ? s.min(f.minLength) : s;
    case 'email':    return z.string().trim().email();
    case 'url':      return z.string().trim().url();
    case 'number': {
      let num = z.coerce.number();
      if (f.integer) num = num.int();
      if (f.min !== undefined) num = num.min(f.min);
      if (f.max !== undefined) num = num.max(f.max);
      return num;
    }
    case 'select':      return z.enum(toEnumValues(f.options));
    case 'multiselect': return z.array(z.enum(toEnumValues(f.options)));
    case 'date':        return z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD');
    case 'file':        return z.any(); // Dateien prüfen wir separat
    default:            return s;
  }
}

function applyRequired(zf, f) {
  return f.required ? zf : zf.optional();
}

/**
 * Baut eine discriminatedUnion('category', ...) aus reinen ZodObjects
 * und hängt die requiredIf-Validierungen EINMAL oben dran.
 */
export function buildServerSchema(config) {
  const objects = [];
  const requiredIfRulesByCat = new Map();

  for (const cat of config.categories) {
    const shape = {};
    // Base-Felder
    for (const f of config.baseFields) shape[f.name] = applyRequired(zodForField(f), f);
    // Kategorie-Felder
    for (const f of cat.fields)        shape[f.name] = applyRequired(zodForField(f), f);

    // Discriminator
    shape['category'] = z.literal(cat.key);

    // ZodObject (ohne superRefine!)
    const obj = z.object(shape);
    objects.push(obj);

    // requiredIf-Regeln sammeln
    const rules = cat.fields.filter(f => !!f.requiredIf).map(f => ({
      field: f.name,
      dependsOn: f.requiredIf.field,
      eq: f.requiredIf.eq,
    }));
    if (rules.length) requiredIfRulesByCat.set(cat.key, rules);
  }

  // Union aus reinen Objekten
  const union = z.discriminatedUnion('category', objects);

  // Ein superRefine für ALLE requiredIf-Fälle
  return union.superRefine((val, ctx) => {
    const rules = requiredIfRulesByCat.get(val.category) || [];
    for (const r of rules) {
      const cond = (val)[r.dependsOn] === r.eq;
      if (cond) {
        const v = (val)[r.field];
        const missing = (Array.isArray(v) ? v.length === 0 : v === undefined || v === null || v === '');
        if (missing) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: [r.field], message: 'Pflichtfeld' });
        }
      }
    }
  });
}

/** Welche Upload-Felder (type=file, required) sind je Kategorie Pflicht? */
export function requiredUploadsForCategory(config, catKey) {
  const cat = config.categories.find(c => c.key === catKey);
  if (!cat) return [];
  return cat.fields.filter(f => f.type === 'file' && f.required).map(f => f.name);
}
