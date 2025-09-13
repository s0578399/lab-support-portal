// app/src/lib/formSchema.ts
import { z, type ZodTypeAny } from "zod";

/** Option in JSON: string ODER {value,label} */
export type Option = string | { value: string; label: string };

export type Field = {
  name: string;
  label: string;
  type: "text" | "textarea" | "email" | "url" | "number" | "select" | "multiselect" | "date" | "file";
  required?: boolean;
  minLength?: number;
  min?: number;
  max?: number;
  integer?: boolean;
  options?: Option[];
  /** UI-Sichtbarkeit: nur anzeigen, wenn field === eq */
  showIf?: { field: string; eq: string };
  /** Dynamische Pflicht: wenn field === eq, dann ist dieses Feld Pflicht */
  requiredIf?: { field: string; eq: string };
  // NEW: Layout-Hinweise (optional)
  step?: number;          // 1..n
  section?: string;       // z.B. "Kosten"
  col?: number;           // 1..12
};

// NEW: Layout-Defaults
export function layoutForField(f: Field) {
  const step = f.step ?? 1;
  const section = f.section ?? "Allgemein";
  const col = Math.min(12, Math.max(1, f.col ?? (f.type === "textarea" ? 12 : 6)));
  return { step, section, col };
}

export type Category = { key: string; label: string; fields: Field[] };

export type FormConfig = {
  categories: Category[];
  baseFields?: Field[]; // z. B. Name, E-Mail, Betreff
};

/** Hilfen */
const isEmpty = (v: unknown) =>
  v === undefined || v === null || (typeof v === "string" && v.trim() === "") || (Array.isArray(v) && v.length === 0);

const normalizeOptions = (opts?: Option[]) =>
  (opts ?? []).map((o) => (typeof o === "string" ? { value: o, label: o } : o));

/** Field -> Zod */
function zodForField(f: Field): ZodTypeAny {
  switch (f.type) {
    case "text":
    case "textarea": {
      let s = z.string().trim();
      if (f.required) s = s.min(1, "Pflichtfeld");
      if (typeof f.minLength === "number") s = s.min(f.minLength);
      return s;
    }
    case "email": {
      let s = z.string().trim().email("Ungültige E-Mail");
      if (!f.required) s = s.optional();
      return s;
    }
    case "url": {
      let s = z.string().trim().url("Ungültige URL");
      if (!f.required) s = s.optional();
      return s;
    }
    case "number": {
      let s = z.coerce.number({ invalid_type_error: "Zahl erwartet" });
      if (f.required) {
        // nichts
      } else {
        s = z.coerce.number().optional();
      }
      if (typeof f.min === "number") s = s.min(f.min);
      if (typeof f.max === "number") s = s.max(f.max);
      if (f.integer) s = s.int("Nur ganze Zahl");
      return s;
    }
    case "select": {
      const values = normalizeOptions(f.options).map((o) => o.value);
      let s = z.string();
      if (values.length) s = s.refine((v) => values.includes(v), "Ungültige Auswahl");
      if (!f.required) s = s.optional();
      return s;
    }
    case "multiselect": {
      const values = normalizeOptions(f.options).map((o) => o.value);
      let s = z.array(z.string());
      if (values.length) s = s.refine((arr) => arr.every((v) => values.includes(v)), "Ungültige Auswahl");
      if (f.required) s = s.min(1, "Mind. eine Auswahl");
      else s = s.optional();
      return s;
    }
    case "date": {
      // yyyy-mm-dd (für MUI TextField type=date)
      let s = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Datum (YYYY-MM-DD)");
      if (!f.required) s = s.optional();
      return s;
    }
    case "file": {
      // Client-seitig nur minimal prüfen; Server validiert Größe/Typ
      const anyFile = z
        .any()
        .refine((fl) => !fl || (fl instanceof File || (fl?.[0] instanceof File)), "Datei erwartet");
      return f.required ? anyFile : anyFile.optional();
    }
    default:
      return z.any();
  }
}

/** Base + Kategorie -> Zod-Objekt mit superRefine für requiredIf */
function objectForCategory(cfg: FormConfig, cat: Category) {
  const baseShape: Record<string, ZodTypeAny> = {};
  (cfg.baseFields ?? []).forEach((f) => (baseShape[f.name] = zodForField(f)));

  const catShape: Record<string, ZodTypeAny> = {};
  cat.fields.forEach((f) => (catShape[f.name] = zodForField(f)));

  // "category" selbst fixieren
  const shape = {
    category: z.literal(cat.key),
    ...baseShape,
    ...catShape,
  };

  // requiredIf via superRefine
  const requiredRules = [...(cfg.baseFields ?? []), ...cat.fields].filter((f) => f.requiredIf);
  const Obj = z.object(shape).superRefine((data, ctx) => {
    requiredRules.forEach((f) => {
      const cond = f.requiredIf!;
      if (String((data as any)[cond.field]) === cond.eq) {
        const val = (data as any)[f.name];
        if (isEmpty(val)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Pflicht (abhängig von Auswahl)",
            path: [f.name],
          });
        }
      }
    });
  });

  return Obj;
}

/** Baut ein discriminatedUnion über "category" */
export function buildClientSchema(cfg: FormConfig) {
  const variants = cfg.categories.map((cat) => objectForCategory(cfg, cat));
  return z.discriminatedUnion("category", variants as [ZodTypeAny, ...ZodTypeAny[]]);
}

/** Kleinere Helfer für den Renderer */
export function visibleByShowIf(field: Field, values: Record<string, unknown>) {
  if (!field.showIf) return true;
  return String(values[field.showIf.field] ?? "") === field.showIf.eq;
}

export const helpers = { normalizeOptions, visibleByShowIf };
