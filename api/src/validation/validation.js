import { z } from 'zod';


// === Ticket-Schema (serverseitige Validierung) ===
// Dieses Schema beschreibt die Mindestanforderungen an ein Support-Ticket.
// Es wird von Zod genutzt, um Requests robust zu prüfen.
// - Fehlertexte sind hier bereits spezifisch in Deutsch hinterlegt.
export const ticketSchema = z.object({
  // Name des Antragstellers
  // - mindestens 2 Zeichen lang
  name: z.string().min(2, 'Name zu kurz'),

  // E-Mail-Adresse des Antragstellers
  // - muss dem Standard-E-Mail-Format entsprechen
  email: z.string().email('Ungültige E-Mail'),

  // Betreff / Titel des Tickets
  // - mindestens 3 Zeichen lang
  subject: z.string().min(3, 'Betreff zu kurz'),

  // Kategorie des Tickets
  // - Auswahl aus vordefinierten Bereichen der Hochschule
  category: z.enum(['IT', 'HR', 'Facilities', 'Library', 'Other']),

  // Dringlichkeit
  // - Auswahl aus drei Stufen
  urgency: z.enum(['low', 'medium', 'high']),

  // Beschreibung des Problems / Anliegens
  // - mindestens 20 Zeichen, damit eine sinnvolle Bearbeitung möglich ist
  description: z.string().min(20, 'Mind. 20 Zeichen')
});
