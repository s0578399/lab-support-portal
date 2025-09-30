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

// ===== Styling: unverändert lassen =====
const fieldSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: (theme: any) => theme.palette.grey[50],
    borderRadius: 0.7,
    "& fieldset": { borderColor: "#E5E7EB" },
    "&:hover fieldset": { borderColor: "#D1D5DB" },
    "&.Mui-focused fieldset": { borderColor: "#9CA3AF" },
  },
  "& .MuiInputBase-input::placeholder": {
    color: "text.disabled",
    opacity: 1,
  },
  "& .MuiInputLabel-root": {
    color: "#000000",
    fontSize: "0.95rem",
    fontWeight: 500,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "100%",
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "#000000",
  },
  "& .MuiInputLabel-root.MuiInputLabel-shrink": {
    transform: "translate(8px, -22px) scale(0.9)",
  },
};

// ===== Helper =====

// macht aus "6" oder 6 eine sichere Zahl 1–12
function toInt(n: unknown): number | undefined {
  if (n === null || n === undefined) return undefined;
  const v = typeof n === "string" ? parseInt(n, 10) : (typeof n === "number" ? n : NaN);
  return Number.isFinite(v) ? Math.min(12, Math.max(1, v)) : undefined;
}

// Optionales "width" Mapping, nur falls KEIN ui.layout gesetzt ist
function widthToCols(w?: string) {
  switch ((w || "").toLowerCase()) {
    case "full": return 12;
    case "half": return 6;
    case "third": return 4;     // echte Drittel
    case "quarter": return 3;
    default: return undefined;
  }
}

// Layout direkt aus schema.json (1:1, aber numerisch erzwingen)
function getSpan(f: Field) {
  const layout = (f as any)?.ui?.layout as Partial<{ xs:number|string; sm:number|string; md:number|string; lg:number|string }> | undefined;

  // 1) ui.layout hat Vorrang
  if (layout && (layout.xs ?? layout.sm ?? layout.md ?? layout.lg) !== undefined) {
    const xs = toInt(layout.xs) ?? 12;
    const sm = toInt(layout.sm) ?? xs;
    const md = toInt(layout.md) ?? sm;
    const lg = toInt(layout.lg) ?? md;
    return { xs, sm, md, lg };
  }

  // 2) ui.width (nur wenn kein layout gesetzt)
  const w = widthToCols((f as any)?.ui?.width);
  if (w) return { xs: 12, sm: 12, md: w, lg: w };

  // 3) Fallbacks pro Typ
  if (f.type === "textarea") return { xs: 12, sm: 12, md: 12, lg: 12 };
  if (f.type === "multiselect" || f.type === "file") return { xs: 12, sm: 12, md: 6, lg: 6 };
  return { xs: 12, sm: 12, md: 3, lg: 3 };
}

// Felder nach „section“ gruppieren (nur für Zeilenumbrüche)
function groupBySection(fields: Field[]) {
  const groups: { key: string; items: Field[] }[] = [];
  let currentKey = (fields[0]?.section as string) || "_";
  let current: Field[] = [];
  for (const f of fields) {
    const key = (f.section as string) || "_";
    if (key !== currentKey && current.length) {
      groups.push({ key: currentKey, items: current });
      current = [];
      currentKey = key;
    }
    current.push(f);
  }
  if (current.length) groups.push({ key: currentKey, items: current });
  return groups;
}

// ===== Renderer =====
export default function JsonFormRenderer<T extends Record<string, any>>({ fields, form }: Props<T>) {
  const { control, unregister } = form;
  const values = useWatch({ control });

  const groups = React.useMemo(() => groupBySection(fields), [fields]);

  return (
    <Box>
      {groups.map((g, gIdx) => (
        <Grid
          key={`group-${gIdx}-${g.key}`}
          container
          columns={12}
          rowSpacing={2}
          columnSpacing={2}
          alignItems="flex-start"
          sx={{ mb: g.key === "_" ? 0 : 2 }}
        >
          {g.items.map((f, idx) => {
            const visible = !f.showIf || visibleByShowIf(f, values as any);

            React.useEffect(() => {
              if (!visible) unregister(f.name);
            }, [visible, f.name, unregister]);

            if (!visible) return null;

            const span = getSpan(f);
            const itemKey = `${f.name}-${gIdx}-${idx}`;
            const itemProps = {
              xs: span.xs ?? 12,
              sm: span.sm ?? span.xs ?? 12,
              md: span.md ?? span.sm ?? 12,
              lg: span.lg ?? span.md ?? 12,
            };

            
            if (import.meta.env.MODE !== "production") {
              // eslint-disable-next-line no-console
              console.debug(`[Grid] ${f.name}`, itemProps, (f as any)?.ui?.layout);
            }

            // TEXT / TEXTAREA
            if (f.type === "text" || f.type === "textarea") {
              return (
                <Grid key={itemKey} item {...itemProps} sx={{ minWidth: 0 }}>
                  <Controller
                    name={f.name as any}
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        fullWidth
                        sx={fieldSx}
                        label={f.label + (f.required ? " *" : "")}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ?? "")}
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                        multiline={f.type === "textarea"}
                        minRows={f.type === "textarea" ? (f.ui?.rows ?? 4) : undefined}
                        placeholder={f.placeholder}
                        InputLabelProps={{ shrink: true }}
                      />
                    )}
                  />
                </Grid>
              );
            }

            // EMAIL
            if (f.type === "email") {
              return (
                <Grid key={itemKey} item {...itemProps} sx={{ minWidth: 0 }}>
                  <Controller
                    name={f.name as any}
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        fullWidth
                        sx={fieldSx}
                        label={f.label + (f.required ? " *" : "")}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ?? "")}
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                        type="email"
                        inputMode="email"
                        placeholder={f.placeholder}
                        InputLabelProps={{ shrink: true }}
                      />
                    )}
                  />
                </Grid>
              );
            }

            // URL
            if (f.type === "url") {
              return (
                <Grid key={itemKey} item {...itemProps} sx={{ minWidth: 0 }}>
                  <Controller
                    name={f.name as any}
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        fullWidth
                        sx={fieldSx}
                        label={f.label + (f.required ? " *" : "")}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ?? "")}
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                        type="url"
                        inputMode="url"
                        placeholder={f.placeholder}
                        InputLabelProps={{ shrink: true }}
                      />
                    )}
                  />
                </Grid>
              );
            }

            // NUMBER
            if (f.type === "number") {
              return (
                <Grid key={itemKey} item {...itemProps} sx={{ minWidth: 0 }}>
                  <Controller
                    name={f.name as any}
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        fullWidth
                        sx={fieldSx}
                        label={f.label + (f.required ? " *" : "")}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          field.onChange(v === "" ? "" : Number(v));
                        }}
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                        type="number"
                        inputMode="decimal"
                        placeholder={f.placeholder}
                        InputLabelProps={{ shrink: true }}
                      />
                    )}
                  />
                </Grid>
              );
            }

            // SELECT (einfach)
            if (f.type === "select") {
              const opts = helpers.normalizeOptions(f.options);
              return (
                <Grid key={itemKey} item {...itemProps} sx={{ minWidth: 0 }}>
                  <Controller
                    name={f.name as any}
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        select
                        fullWidth
                        sx={fieldSx}
                        label={f.label + (f.required ? " *" : "")}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ?? "")}
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                        SelectProps={{
                          displayEmpty: true,
                          renderValue: (v: any) =>
                            v ? (opts.find(o => o.value === v)?.label ?? v)
                              : (f.placeholder ?? "Bitte auswählen …"),
                        }}
                        InputLabelProps={{ shrink: true }}
                      >
                        <MenuItem value="" disabled={!!f.required}>
                          <em>{f.placeholder ?? "Bitte auswählen …"}</em>
                        </MenuItem>
                        {opts.map((o) => (
                          <MenuItem key={o.value} value={o.value}>
                            {o.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  />
                </Grid>
              );
            }

            // MULTISELECT
            if (f.type === "multiselect") {
              const opts = helpers.normalizeOptions(f.options);
              return (
                <Grid key={itemKey} item {...itemProps} sx={{ minWidth: 0 }}>
                  <Controller
                    name={f.name as any}
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        select
                        SelectProps={{
                          multiple: true,
                          MenuProps: {
                            PaperProps: {
                              sx: {
                                borderRadius: 0,
                                border: "1px solid #E5E7EB",
                                boxShadow: "none",
                                "& .MuiMenuItem-root": { fontSize: "0.95rem" }
                              }
                            }
                          },
                          renderValue: (selected: any) => {
                            const arr = Array.isArray(selected) ? selected : [];
                            if (!arr.length) {
                              return <span style={{ color: "rgba(0,0,0,0.38)" }}>
                                {f.placeholder ?? "Bitte auswählen …"}
                              </span>;
                            }
                            return arr.join(", ");
                          }
                        }}
                        fullWidth
                        sx={fieldSx}
                        label={f.label + (f.required ? " *" : "")}
                        value={Array.isArray(field.value) ? field.value : (field.value ? String(field.value).split(",") : [])}
                        onChange={(e) => {
                          const v = e.target.value;
                          const arr = Array.isArray(v) ? v : String(v).split(",");
                          field.onChange(arr.filter(Boolean));
                        }}
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                        InputLabelProps={{ shrink: true }}
                        placeholder={f.placeholder}
                      >
                        {opts.map((o) => (
                          <MenuItem key={o.value} value={o.value}>
                            {o.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  />
                </Grid>
              );
            }

            // DATE
            if (f.type === "date") {
              return (
                <Grid key={itemKey} item {...itemProps} sx={{ minWidth: 0 }}>
                  <Controller
                    name={f.name as any}
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        fullWidth
                        sx={fieldSx}
                        type="date"
                        label={f.label + (f.required ? " *" : "")}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ?? "")}
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                        InputLabelProps={{ shrink: true }}
                        placeholder={f.placeholder}
                      />
                    )}
                  />
                </Grid>
              );
            }

            // FILE
            if (f.type === "file") {
              return (
                <Grid key={itemKey} item {...itemProps} sx={{ minWidth: 0 }}>
                  <Box sx={{ mb: 2 }}>
                    <Controller
                      name={f.name as any}
                      control={control}
                      render={({ field, fieldState }) => (
                        <div>
                          <input
                            type="file"
                            name={f.name}
                            accept={
                              Array.isArray((f as any).accept)
                                ? (f as any).accept.join(",")
                                : (f as any).accept
                            }
                            onChange={(e) => {
                              const fl = e.target.files;
                              const file = fl && fl.length > 0 ? fl[0] : null;
                              field.onChange(file);
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
                </Grid>
              );
            }

            return <React.Fragment key={itemKey} />;
          })}
        </Grid>
      ))}
    </Box>
  );
}
