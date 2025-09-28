// app/components/JsonFormRenderer.tsx
import * as React from "react";
import { TextField, MenuItem, Box, Grid } from "@mui/material";
import { Controller, type UseFormReturn, useWatch } from "react-hook-form";
import type { Field } from "../src/lib/formSchema";
import { helpers, visibleByShowIf } from "../src/lib/formSchema";

type Props<T extends Record<string, any>> = {
  fields: Field[];
  form: UseFormReturn<T>;
};

export default function JsonFormRenderer<T extends Record<string, any>>({ fields, form }: Props<T>) {
  const { control, register, unregister, setValue, formState: { errors } } = form;
  const values = useWatch({ control });

  // Hilfsfunktionen
  const errOf = (name: string) => (errors as any)?.[name]?.message as string | undefined;

  return (
    <Box>
      {fields.map((f) => {
        const visible = !f.showIf || visibleByShowIf(f, values as any);

        // Unsichtbare Felder aus RHF austragen, sichtbare (wieder) registrieren
        React.useEffect(() => {
          if (!visible) unregister(f.name);
        }, [visible, f.name, unregister]);

        if (!visible) return null;

        // TEXT & TEXTAREA
        if (f.type === "text" || f.type === "textarea") {
          return (
            <Controller
              key={f.name}
              name={f.name as any}
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  label={f.label + (f.required ? " *" : "")}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value ?? "")}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  multiline={f.type === "textarea"}
                  minRows={f.type === "textarea" ? 4 : undefined}
                />
              )}
            />
          );
        }

        // EMAIL
        if (f.type === "email") {
          return (
            <Controller
              key={f.name}
              name={f.name as any}
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  label={f.label + (f.required ? " *" : "")}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value ?? "")}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  type="email"
                  inputMode="email"
                />
              )}
            />
          );
        }

        // URL
        if (f.type === "url") {
          return (
            <Controller
              key={f.name}
              name={f.name as any}
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  label={f.label + (f.required ? " *" : "")}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value ?? "")}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  type="url"
                  inputMode="url"
                />
              )}
            />
          );
        }

        // NUMBER
        if (f.type === "number") {
          return (
            <Controller
              key={f.name}
              name={f.name as any}
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  label={f.label + (f.required ? " *" : "")}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value ?? "")}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  inputMode="decimal"
                />
              )}
            />
          );
        }

        // SELECT (einfach)
        if (f.type === "select") {
          const opts = helpers.normalizeOptions(f.options);
          return (
            <Controller
              key={f.name}
              name={f.name as any}
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  select
                  fullWidth
                  label={f.label + (f.required ? " *" : "")}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value ?? "")}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                >
                  {!f.required && <MenuItem value="">{/* leer erlaubt */}</MenuItem>}
                  {opts.map((o) => (
                    <MenuItem key={o.value} value={o.value}>
                      {o.label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          );
        }

        // MULTISELECT
        if (f.type === "multiselect") {
          const opts = helpers.normalizeOptions(f.options);
          return (
            <Controller
              key={f.name}
              name={f.name as any}
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  select
                  SelectProps={{ multiple: true }}
                  fullWidth
                  label={f.label + (f.required ? " *" : "")}
                  value={Array.isArray(field.value) ? field.value : (field.value ? String(field.value).split(",") : [])}
                  onChange={(e) => {
                    const v = e.target.value;
                    const arr = Array.isArray(v) ? v : String(v).split(",");
                    field.onChange(arr.filter(Boolean));
                  }}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                >
                  {opts.map((o) => (
                    <MenuItem key={o.value} value={o.value}>
                      {o.label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          );
        }

        // DATE (YYYY-MM-DD)
        if (f.type === "date") {
          return (
            <Controller
              key={f.name}
              name={f.name as any}
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  type="date"
                  label={f.label + (f.required ? " *" : "")}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value ?? "")}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  InputLabelProps={{ shrink: true }}
                />
              )}
            />
          );
        }

        // FILE (ein oder mehrere Dateien)
        // innerhalb der Map über fields …
        if (f.type === "file") {
          return (
            <Box key={f.name} sx={{ mb: 2 }}>
              <Controller
                name={f.name as any}
                control={control}
                render={({ field, fieldState }) => (
                  <div>
                    <input
                      type="file"
                      name={f.name}
                      // aus dem Schema übernehmbar: Array oder String
                      accept={
                        Array.isArray((f as any).accept)
                          ? (f as any).accept.join(",")
                          : (f as any).accept
                      }
                      onChange={(e) => {
                        const fl = e.target.files;
                        const file = fl && fl.length > 0 ? fl[0] : null;                      
                        field.onChange(file);        // <- WICHTIG: File in RHF-State schreiben
                      }}
                    />
                    {fieldState.error && (
                      <Box sx={{ color: "error.main", fontSize: 12, mt: 0.5 }}>
                        {fieldState.error.message}
                      </Box>
                    )}
                  </div>
                )}
              />
            </Box>
          );
        }

        // Fallback
        return <div key={f.name} />;
      })}
    </Box>
  );
}
