// app/src/TicketForm.tsx
import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TextField, Button, Stack, MenuItem, CircularProgress } from '@mui/material';
import config from '../../config/form.schema.json';
import JsonFormRenderer from '../components/JsonFormRenderer';
import { buildClientSchema } from './lib/formSchema';


// 💡 Optional: Typsicher aus dem Zod-Schema ableiten (statt any)
// import type { z } from 'zod';
// type ClientData = z.infer<ReturnType<typeof buildClientSchema>>;
type FormData = any;

// Optionen für Kategorie-Dropdown aus JSON-Konfig
const CATEGORY_OPTIONS = config.categories.map(c => ({ value: c.key, label: c.label }));


/**
 * Baut Request-Payload:
 * - JSON für reine Form-Werte
 * - multipart/form-data, falls Datei-Felder vorhanden
 *   (Arrays werden als CSV seriellisiert → Server normalisiert zurück zu Arrays)
 */
function buildPayload(values: any) {
  // multipart falls Datei-Felder vorhanden
  const hasFiles = Object.keys(values).some(k => values[k] instanceof FileList && values[k].length > 0);
  if (!hasFiles) return { body: JSON.stringify(values), headers: { 'Content-Type': 'application/json' } };

  const fd = new FormData();
  for (const [k, v] of Object.entries(values)) {
    if (v instanceof FileList) {
       // derzeit nur 1 Datei je Feld (Server verlangt Pflichtdateien einzeln)
      if (v[0]) fd.append(k, v[0]);
      continue;
    }
    if (Array.isArray(v)) {
       // Arrays als CSV → Server splittet per ',' (siehe Backend-Normalisierung)
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

  // RHF-Setup mit Zod-Resolver, Default-Kategorie auf erste Option
  const { register, handleSubmit, watch, reset, control, formState: { errors, isSubmitting } } =
    useForm<FormData>({
      resolver: zodResolver(ClientSchema),
      defaultValues: { category: CATEGORY_OPTIONS[0].value },  // falls Kategorien leer wären
      shouldUnregister: false, // dynamische Felder behalten auch versteckt ihren Wert
      mode: 'onBlur',  // Validierung beim Verlassen des Feldes
    });

    // Aktuell ausgewählte Kategorie → steuert dynamische Felder unten
  const category = watch('category');
  const currentCat = (config as any).categories.find((c: any) => c.key === category);

  // Submit-Handler: schickt an /api/tickets, behandelt JSON/multipart automatisch
  const onSubmit = async (values: FormData) => {
    setLastError(null);
    try {
      const base = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
      const { body, headers } = buildPayload(values);
      // 🌐 Falls API Cookies/Sessions nutzt: credentials: 'include' hinzufügen
      const res = await fetch(`${base}/api/tickets`, { method: 'POST', headers, body });
       // Antwort robust parsen (auch wenn kein JSON)
      const data = await res.json().catch(() => ({}));
       // Server liefert 'error' + optionale details → kurze Menschen-lesbare Meldung bauen
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      // Erfolgreich: Formular zurücksetzen (Kategorie wieder auf default)
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
