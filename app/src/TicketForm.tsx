// app/src/TicketForm.tsx
import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TextField, Button, Stack, MenuItem, CircularProgress } from '@mui/material';
import config from '../../config/form.schema.json';
import JsonFormRenderer from '../components/JsonFormRenderer';
import { buildClientSchema } from './lib/formSchema';

type FormData = any;

const CATEGORY_OPTIONS = config.categories.map(c => ({ value: c.key, label: c.label }));

function buildPayload(values: any) {
  // multipart falls Datei-Felder vorhanden
  const hasFiles = Object.keys(values).some(k => values[k] instanceof FileList && values[k].length > 0);
  if (!hasFiles) return { body: JSON.stringify(values), headers: { 'Content-Type': 'application/json' } };

  const fd = new FormData();
  for (const [k, v] of Object.entries(values)) {
    if (v instanceof FileList) {
      if (v[0]) fd.append(k, v[0]);
      continue;
    }
    if (Array.isArray(v)) {
      fd.append(k, v.join(',')); // Arrays als CSV (z. B. labRooms)
      continue;
    }
    if (v !== undefined && v !== null) fd.append(k, String(v));
  }
  return { body: fd, headers: {} as Record<string,string> };
}

export default function TicketForm({ onSuccess, onError }: { onSuccess?: () => void; onError?: (m: string) => void; }) {
  const ClientSchema = useMemo(() => buildClientSchema(config as any), []);
  const [lastError, setLastError] = useState<string | null>(null);

  const { register, handleSubmit, watch, reset, control, formState: { errors, isSubmitting } } =
    useForm<FormData>({
      resolver: zodResolver(ClientSchema),
      defaultValues: { category: CATEGORY_OPTIONS[0].value },
      shouldUnregister: false,
      mode: 'onBlur',
    });

  const category = watch('category');
  const currentCat = (config as any).categories.find((c: any) => c.key === category);

  const onSubmit = async (values: FormData) => {
    setLastError(null);
    try {
      const base = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
      const { body, headers } = buildPayload(values);
      const res = await fetch(`${base}/api/tickets`, { method: 'POST', headers, body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      reset({ category: CATEGORY_OPTIONS[0].value });
      onSuccess?.();
    } catch (e: any) {
      setLastError(e?.message ?? 'Versand fehlgeschlagen');
      onError?.(e?.message ?? 'Versand fehlgeschlagen');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack spacing={2}>
        {/* Basisfelder (aus JSON) */}
        <JsonFormRenderer fields={(config as any).baseFields} register={register} errors={errors} control={control} />

        {/* Kategorie */}
        <TextField select label="Kategorie" {...register('category')} error={!!errors.category} helperText={(errors as any)?.category?.message as string} fullWidth required>
          {CATEGORY_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
        </TextField>

        {/* Dynamische Felder der Kategorie */}
        {currentCat && (
          <JsonFormRenderer fields={currentCat.fields} register={register} errors={errors} control={control} />
        )}

        <Button type="submit" variant="contained" disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={18}/> : undefined}>
          {isSubmitting ? 'Senden …' : 'Ticket senden'}
        </Button>

        {lastError && <div style={{ color: 'crimson', fontWeight: 600 }}>{lastError}</div>}
      </Stack>
    </form>
  );
}
