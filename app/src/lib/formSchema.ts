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
  // Layout-Hinweise (optional)
  step?: number;          // 1..n
  section?: string;       // z.B. "Kosten"
  col?: number;           // 1..12
  /** Nur für Datei-Felder */           //NEU!!
  accept?: string[] | string;           //NEU!!
  maxSizeMB?: number;                   //NEU!!
  multiple?: boolean;                   //NEU!!
};

// Layout-Defaults
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

/** Leere Eingaben zu undefined normalisieren (für optionale Felder) */
const emptyToUndef = (v: unknown) => (v === "" || v === null || v === undefined ? undefined : v);

// Helper: alles auf einen einzelnen File normalisieren (oder undefined/null)
const toSingleFile = (v: unknown) => {
    if (v === "" || v === undefined) return undefined;
    if (v === null) return null;
    if (v instanceof File) return v;
    // FileList (vom <input type="file">) oder Array<File>
    const anyObj = v as any;
    if (Array.isArray(anyObj) && anyObj[0] instanceof File) return anyObj[0];
    if (anyObj && typeof anyObj === "object" && "length" in anyObj && anyObj[0] instanceof File) {
      return anyObj[0];
    }
    return v;
  };
  
  // Zod für Datei-Felder (single file), optional mit accept/maxSizeMB
  function zodFileFor(field: Field) {
    // Basis: nach Preprocess muss ein File da sein (oder leer bei optional)
    let base = z.preprocess(
      toSingleFile,
      z.instanceof(File, { message: "Datei erwartet" })
    );
  
    // optional/nullable abbilden
    if (!field.required) {
      base = base.optional().nullable();
    }
  
    // Typ/Größe nur prüfen, wenn tatsächlich ein File vorhanden ist
    if (field.maxSizeMB) {
      const max = field.maxSizeMB;
      base = base.refine(
        (f) => !f || f.size <= max * 1024 * 1024,
        { message: `Datei zu groß (max. ${max} MB)` }
      );
    }
    if (field.accept) {
      const accepts = Array.isArray(field.accept) ? field.accept : String(field.accept).split(",");
      base = base.refine((f) => {
        if (!f) return true;
        return accepts.some((patRaw) => {
          const pat = patRaw.trim();
          if (!pat) return false;
          if (pat.endsWith("/*")) {
            const prefix = pat.slice(0, pat.indexOf("/"));
            return f.type.startsWith(prefix + "/");
          }
          return f.type === pat;
        });
      }, { message: "Ungültiger Dateityp" });
    }
  
    return base;
  }

/** Field -> Zod */
function zodForField(f: Field): ZodTypeAny {
  switch (f.type) {
    case "text":
    case "textarea": {
      // required: min direkt auf innerem z.string(); optional: inner ggf. mit min, außen optional
      if (f.required) {
        const min = Math.max(1, f.minLength ?? 1);
        const inner = z.string().trim().min(min, min > 1 ? `Mind. ${min} Zeichen` : "Pflichtfeld");
        return z.preprocess(emptyToUndef, inner);
      } else {
        const inner = f.minLength
          ? z.string().trim().min(f.minLength, `Mind. ${f.minLength} Zeichen`)
          : z.string().trim();
        return z.preprocess(emptyToUndef, inner).optional();
      }
    }
    case "email": {
      const inner = z.string().trim().email("Ungültige E-Mail");
      return f.required 
        ? z.preprocess(emptyToUndef, inner)
        : z.preprocess(emptyToUndef, inner).optional();
    }
    case "url": {
      const inner = z.string().trim().url("Ungültige URL");
      return f.required
        ? z.preprocess(emptyToUndef, inner)
        : z.preprocess(emptyToUndef, inner).optional();
    }
    case "number": {
      // Inneres number-Schema zuerst konfigurieren, dann mit preprocess umwickeln
      let inner = z.number({ invalid_type_error: "Zahl erwartet" });
      if (f.integer) inner = inner.int("Nur ganze Zahl");
      if (typeof f.min === "number") inner = inner.min(f.min);
      if (typeof f.max === "number") inner = inner.max(f.max);

      const coerce = z.preprocess((v) => {
        if (v === "" || v == null) return undefined;
        const s = typeof v === "string" ? v.replace(",", ".") : String(v);
        const n = Number(s);
        return Number.isFinite(n) ? n : NaN;
      }, inner);

      return f.required ? coerce : coerce.optional(); 
    }
    case "select": {
      const values = normalizeOptions(f.options).map((o) => o.value);
      const inner = z.string();
      const withEnum = values.length
        ? inner.refine((v) => values.includes(v), "Ungültige Auswahl")
        : inner;
      if (f.required) {
        const requiredInner = withEnum.min(1, "Bitte auswählen");
        return z.preprocess(emptyToUndef, requiredInner);
      } else {
        return z.preprocess(emptyToUndef, withEnum).optional();
      }
    }

    // !!! Der ganze Multiselect-Teil ist glaub ich unnötig verkompliziert -> Nochmal prüfen später!!
    case "multiselect": {
      // 1) Eingabe normalisieren: '', undefined → undefined; 'a,b' → ['a','b']; Array bleibt Array
      const normalized = z.preprocess((v) => {
        if (v == null || v === "") return undefined;
        if (Array.isArray(v)) return v.filter(Boolean);
        return String(v).split(",").map((s) => s.trim()).filter(Boolean);
      }, z.any()); // Zwischenschritt, inneres Array wird separat gebaut

      // 2) Inneres Array-Schema vollständig konfigurieren
      const values = normalizeOptions(f.options).map((o) => o.value);
      let inner = z.array(z.string());
      if (values.length) { // NEU!!!
        inner = inner.refine((arr) => arr.every((x) => values.includes(x)), "Ungültige Auswahl");
      }
      if (f.required) { 
        inner = inner.min(1, "Mind. eine Auswahl");
      }

      // 3) normalized → inner mappen: Wenn normalized undefined ist und nicht required, ist das okay
      //    Das wird erreicht, indem ein Refinement auf normalizied gelegt und dann optional gesetz wird
      let schema = normalized.refine(
        (val) => val === undefined || Array.isArray(val), // nur Arrays oder undefined
        { message: "Ungültige Auswahl" }
      ).transform((val) => (val === undefined ? undefined : (val as string[]))); // Cast 

      // 4) Jetzt das innere Array-Schema auf das transformierte Ergebnis anwenden
      //    Magiiiiic: z.union, um entweder undefined (bei !required) oder das geprüfte Array zu erlauben
      schema = f.required 
        ? z.union([schema as unknown as z.ZodType<string[]>, inner]) // required: transformiertes Array muss inner erfüllen
        : z.union([z.undefined(), inner]).optional().superRefine((val, ctx) => { // optional: undefined erlaubt
            if (val === undefined) return; // ok 
            const parsed = inner.safeParse(val); 
            if (!parsed.success) {
              parsed.error.issues.forEach((issue) => ctx.addIssue(issue));
            } 
          });

      return schema;
    }
    case "date": {
      // yyyy-mm-dd (für MUI TextField type=date), optional erlaubt undefined
      const inner = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Datum (YYYY-MM-DD)");
      return f.required
        ? z.preprocess(emptyToUndef, inner)
        : z.preprocess(emptyToUndef, inner).optional();
    }
    case "file": {
      return zodFileFor(f);
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
