// app/components/JsonFormRenderer.tsx
import * as React from "react";
import { TextField, MenuItem, Box, Chip } from "@mui/material";
import { Controller, type Control, type FieldErrors, type UseFormReturn, useWatch } from "react-hook-form";
import type { Field } from "../src/lib/formSchema";
import { helpers, visibleByShowIf } from "../src/lib/formSchema";

type Props<T extends Record<string, any>> = {
  fields: Field[];
  form: UseFormReturn<T>;
};

export default function JsonFormRenderer<T extends Record<string, any>>({ fields, form }: Props<T>) {
  const { control, register, unregister, setValue, formState: { errors } } = form;
  const values = useWatch({ control });

  // Unsichtbare Felder sauber deregistrieren
  React.useEffect(() => {
    fields.forEach((f) => {
      const visible = visibleByShowIf(f, values ?? {});
      if (!visible) {
        unregister(f.name, { keepValue: false });
        setValue(f.name as any, undefined);
      }
    });
  }, [JSON.stringify(values), fields, unregister, setValue]);

  return (
    <>
      {fields.map((f) => {
        const err = (errors as FieldErrors<any>)[f.name]?.message as string | undefined;
        const visible = visibleByShowIf(f, values ?? {});
        if (!visible) return null;

        // Multiselect
        if (f.type === "multiselect") {
          const opts = helpers.normalizeOptions(f.options);
          return (
            <Controller
              key={f.name}
              control={control}
              name={f.name as any}
              render={({ field }) => (
                <TextField
                  select
                  fullWidth
                  label={f.label + (f.required ? " *" : "")}
                  value={field.value ?? []}
                  onChange={field.onChange}
                  error={!!err}
                  helperText={err}
                  SelectProps={{
                    multiple: true,
                    renderValue: (selected) => (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {(selected as string[]).map((v) => (
                          <Chip key={v} label={opts.find((o) => o.value === v)?.label ?? v} />
                        ))}
                      </Box>
                    ),
                  }}
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

        // Select
        if (f.type === "select") {
          const opts = helpers.normalizeOptions(f.options);
          return (
            <Controller
              key={f.name}
              control={control}
              name={f.name as any}
              render={({ field }) => (
                <TextField
                  select
                  fullWidth
                  label={f.label + (f.required ? " *" : "")}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  error={!!err}
                  helperText={err}
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

        // Datei (einzeln)
        if (f.type === "file") {
          return (
            <Box key={f.name}>
              <label style={{ display: "block", marginBottom: 4 }}>{f.label}{f.required ? " *" : ""}</label>
              <input type="file" {...register(f.name as any)} />
              {err && <div style={{ color: "crimson", fontSize: 12 }}>{err}</div>}
            </Box>
          );
        }

        // Text | Textarea | Email | URL | Number | Date
        const common = {
          fullWidth: true,
          error: !!err,
          helperText: err,
          label: f.label + (f.required ? " *" : ""),
        } as const;

        if (f.type === "textarea") {
          return (
            <Controller
              key={f.name}
              control={control}
              name={f.name as any}
              render={({ field }) => (
                <TextField {...common} {...field} multiline minRows={4} />
              )}
            />
          );
        }

        if (f.type === "number") {
          return (
            <Controller
              key={f.name}
              control={control}
              name={f.name as any}
              render={({ field }) => (
                <TextField
                  {...common}
                  {...field}
                  type="number"
                  inputProps={{ inputMode: "numeric", step: f.integer ? 1 : "any", min: f.min, max: f.max }}
                />
              )}
            />
          );
        }

        if (f.type === "date") {
          return (
            <Controller
              key={f.name}
              control={control}
              name={f.name as any}
              render={({ field }) => (
                <TextField
                  {...common}
                  {...field}
                  type="date"
                  InputLabelProps={{ shrink: true }}
                />
              )}
            />
          );
        }

        // Default: text/email/url
        return (
          <Controller
            key={f.name}
            control={control}
            name={f.name as any}
            render={({ field }) => <TextField {...common} {...field} type={f.type === "email" ? "email" : f.type === "url" ? "url" : "text"} />}
          />
        );
      })}
    </>
  );
}
