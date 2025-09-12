import { z } from 'zod';

export const ticketSchema = z.object({
  name: z.string().min(2, 'Name zu kurz'),
  email: z.string().email('Ungültige E-Mail'),
  subject: z.string().min(3, 'Betreff zu kurz'),
  category: z.enum(['IT', 'HR', 'Facilities', 'Library', 'Other']),
  urgency: z.enum(['low', 'medium', 'high']),
  description: z.string().min(20, 'Mind. 20 Zeichen')
});
