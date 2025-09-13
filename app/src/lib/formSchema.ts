// app/src/lib/formSchema.ts
import { z, ZodTypeAny } from 'zod';

type Option = string | { value: string; label: string };
type Field = {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'email' | 'url' | 'number' | 'select' | 'multiselect' | 'date' | 'file';
  required?: boolean;
  minLength?: number;
  min?: number;
  max?: number;
  integer?: boolean;
  options?: Option[];
  requiredIf?: { field: string; eq: string };
  showIf?: { field: string; eq: string };
};
type Category = { key: string; label: string; fields: Field[] };
type Config = { baseFields: Field[]; categories: Category[] };

function toEnumValues(opts: Option[]): [string, ...string[]] {
  const vals = opts.map(o => typeof o === 'string' ? o : o.value);
  if (vals.length === 0) throw new Error('select requires options');
  return vals as [string, ...string[]];
}

function zodForField(f: Field): ZodTypeAny {
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
    case 'select':      return z.enum(toEnumValues(f.options ?? []));
    case 'multiselect': return z.array(z.enum(toEnumValues(f.options ?? [])));
    case 'date':        return z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD');
    case 'file':        return z.any(); // client: nur Präsenz prüfen; Server prüft Typ/Größe
    default:            return s;
  }
}

function applyRequired(zf: ZodTypeAny, f: Field) {
  return f.required ? zf : zf.optional();
}

export function buildClientSchema(config: Config) {
  const unions = config.categories.map((cat) => {
    const shape: Record<string, ZodTypeAny> = {};
    for (const f of config.baseFields) shape[f.name] = applyRequired(zodForField(f), f);
    for (const f of cat.fields)        shape[f.name] = applyRequired(zodForField(f), f);
    shape['category'] = z.literal(cat.key);
    return z.object(shape).superRefine((val, ctx) => {
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
  return z.discriminatedUnion('category', unions as any);
}

export type ClientSchemaType = ReturnType<typeof buildClientSchema>;
