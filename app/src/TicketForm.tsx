// app/src/TicketForm.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  TextField,
  Button,
  Stack,
  MenuItem,
  CircularProgress,
} from '@mui/material';

const Schema = z.object({
  name: z.string().trim().min(2, 'Bitte vollständigen Namen angeben.'),
  email: z.string().trim().email('Ungültige E-Mail.'),
  subject: z.string().trim().min(3, 'Mind. 3 Zeichen.'),
  category: z.enum(['IT', 'HR', 'Facilities', 'Library', 'Other'], {
    errorMap: () => ({ message: 'Bitte eine Kategorie wählen.' }),
  }),
  urgency: z.enum(['low', 'medium', 'high'], {
    errorMap: () => ({ message: 'Bitte eine Priorität wählen.' }),
  }),
  description: z.string().trim().min(20, 'Mind. 20 Zeichen.'),
});

export type FormValues = z.infer<typeof Schema>;

type Props = {
  onSuccess?: () => void;
  onError?: (message: string) => void;
};

const defaultValues: FormValues = {
  name: '',
  email: '',
  subject: '',
  category: 'IT',
  urgency: 'medium',
  description: '',
};

function humanizeServerError(data: any, status: number) {
  // Zeigt Validierungsdetails (vom Backend) schön an
  if (data?.details?.fieldErrors) {
    const parts = Object.entries<Record<string, string[]>>(data.details.fieldErrors)
      .flatMap(([field, msgs]) => msgs.map((m) => `${field}: ${m}`));
    if (parts.length) return parts.join(' | ');
  }
  return data?.error ? `${data.error} (HTTP ${status})` : `HTTP ${status}`;
}

export default function TicketForm({ onSuccess, onError }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues,
    shouldUnregister: false, // verhindert, dass Felder nach Umschalten "verschwinden"
    mode: 'onBlur',
  });

  const [lastError, setLastError] = useState<string | null>(null);

  const onSubmit = async (values: FormValues) => {
    setLastError(null);

    // Debug-Hilfe: sieh im Browser-Console-Log, was rausgeht
    // console.log('Submitting values:', values);

    try {
      const base = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
      const res = await fetch(`${base}/api/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values), // <— flach, kein { payload: … }
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = humanizeServerError(data, res.status);
        throw new Error(msg);
      }

      // Erfolg
      reset(defaultValues);
      onSuccess?.();
    } catch (e: any) {
      const msg = e?.message ?? 'Versand fehlgeschlagen';
      setLastError(msg);
      onError?.(msg);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack spacing={2}>
        <TextField
          label="Name"
          placeholder="Max Mustermann"
          {...register('name')}
          error={!!errors.name}
          helperText={errors.name?.message}
          required
          fullWidth
        />

        <TextField
          label="E-Mail"
          type="email"
          placeholder="max@example.com"
          {...register('email')}
          error={!!errors.email}
          helperText={errors.email?.message}
          required
          fullWidth
        />

        <TextField
          label="Betreff"
          placeholder="Drucker defekt"
          {...register('subject')}
          error={!!errors.subject}
          helperText={errors.subject?.message}
          required
          fullWidth
        />

        <TextField
          select
          label="Kategorie"
          {...register('category')}
          error={!!errors.category}
          helperText={errors.category?.message}
          required
          fullWidth
        >
          {['IT', 'HR', 'Facilities', 'Library', 'Other'].map((v) => (
            <MenuItem key={v} value={v}>
              {v}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Priorität"
          {...register('urgency')}
          error={!!errors.urgency}
          helperText={errors.urgency?.message}
          required
          fullWidth
        >
          {['low', 'medium', 'high'].map((v) => (
            <MenuItem key={v} value={v}>
              {v}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Beschreibung"
          placeholder="Bitte das Problem kurz und präzise beschreiben …"
          multiline
          minRows={4}
          {...register('description')}
          error={!!errors.description}
          helperText={errors.description?.message}
          required
          fullWidth
        />

        <Button
          type="submit"
          variant="contained"
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={18} /> : undefined}
        >
          {isSubmitting ? 'Senden …' : 'Ticket senden'}
        </Button>

        {/* Optional: letzte Serverfehlermeldung unter dem Formular anzeigen */}
        {lastError && (
          <TextField
            value={lastError}
            variant="filled"
            InputProps={{ readOnly: true }}
            hiddenLabel
            fullWidth
            error
            sx={{
              '& .MuiInputBase-input.MuiFilledInput-input': { color: 'error.main', fontWeight: 500 },
            }}
          />
        )}
      </Stack>
    </form>
  );
}
