// app/src/lib/zodErrorMapDE.ts
import { ZodIssueCode, type ZodErrorMap } from "zod";

export const deErrorMap: ZodErrorMap = (issue, ctx) => {
  switch (issue.code) {
    case ZodIssueCode.invalid_type: {
      const exp = (issue as any).expected;
      const rec = (issue as any).received;
      // Leere Eingaben werden oft zu undefined/null vorvalidiert → "Pflicht"-Fall:
      if (rec === "undefined" || rec === "null" || rec == null) {
        // Für Zahlen eine neutrale Pflichtmeldung, sonst "Feld leer"
        if (exp === "number" || exp === "bigint") return { message: "Angabe erforderlich" };
        return { message: "Dieses Feld darf nicht leer sein" };
      }
      // Erwartet string, aber etwas anderes geliefert
      if (exp === "string") return { message: "Ungültige Eingabe" };
      // Erwartet number, aber string/anderes geliefert
      if (exp === "number" || exp === "bigint") return { message: "Bitte eine Zahl eingeben" };
      return { message: "Ungültige Eingabe" };
    }
    case ZodIssueCode.invalid_string:
      if ((issue as any).validation === "email") return { message: "Bitte gültige E-Mail-Adresse eingeben" };
      if ((issue as any).validation === "url") return { message: "Bitte gültige URL eingeben" };
      return { message: "Ungültige Eingabe" };

    case ZodIssueCode.too_small: {
      const i: any = issue;
      if (i.type === "string") {
        if (i.minimum === 1) return { message: "Dieses Feld darf nicht leer sein" };
        return { message: `Mindestens ${i.minimum} Zeichen` };
      }
      if (i.type === "number") return { message: `Wert muss ≥ ${i.minimum} sein` };
      if (i.type === "array") return { message: `Mindestens ${i.minimum} Elemente` };
      return { message: "Wert ist zu klein" };
    }

    case ZodIssueCode.too_big: {
      const i: any = issue;
      if (i.type === "string") return { message: `Maximal ${i.maximum} Zeichen` };
      if (i.type === "number") return { message: `Wert muss ≤ ${i.maximum} sein` };
      if (i.type === "array") return { message: `Maximal ${i.maximum} Elemente` };
      return { message: "Wert ist zu groß" };
    }

    case ZodIssueCode.invalid_enum_value:
      return { message: "Bitte eine gültige Auswahl treffen" };
    case ZodIssueCode.invalid_date:
      return { message: "Bitte ein gültiges Datum eingeben" };
    case ZodIssueCode.not_multiple_of:
      return { message: `Wert muss ein Vielfaches von ${(issue as any).multipleOf} sein` };
    case ZodIssueCode.invalid_union:
    case ZodIssueCode.invalid_union_discriminator:
      return { message: "Ungültige Eingabe" };
    case ZodIssueCode.custom:
      return { message: (issue as any).message ?? "Ungültige Eingabe" };

    default:
      return { message: ctx.defaultError };
  }
};
