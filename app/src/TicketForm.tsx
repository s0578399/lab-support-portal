// app/src/TicketForm.tsx
import * as React from "react";
import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
import {
  Box, Container, Paper, Stack, Typography, Avatar,
  Stepper, Step, StepLabel, Button, Snackbar, Alert, TextField, MenuItem, Grid
} from "@mui/material";
// Logo aus public/ verwenden (Datei: /public/htw-logo.jpg)
const logoSrc = "../../htw-logo.jpg";

import formConfig from "../config/form.schema.json";
import type { FormConfig, Category } from "./lib/formSchema";
import { buildClientSchema } from "./lib/formSchema";
import GroupedFields from "../components/GroupedFields";

type FormShape = Record<string, any>;

const steps = ["Ticket-Details", "Kontaktdaten", "Übersicht"];

export default function TicketForm() {
  const cfg = formConfig as unknown as FormConfig;

  const categories = cfg.categories;
  const defaultCat = categories[0]?.key ?? "default";
  const [active, setActive] = useState(0);
  const [snack, setSnack] = useState<{ open: boolean; msg: string; sev: "success" | "error" }>({
    open: false,
    msg: "",
    sev: "success",
  });

  // Zod-Union aus JSON
  const ClientSchema = useMemo(() => buildClientSchema(cfg), [cfg]);

  const form = useForm<FormShape>({
    resolver: zodResolver(ClientSchema),
    defaultValues: { category: defaultCat },
    mode: "onSubmit",
  });

  const { handleSubmit, watch } = form;
  const currentKey = watch("category") || defaultCat;
  const currentCat: Category | undefined = categories.find((c) => c.key === currentKey);

  // Alle Felder: Base + aktuelle Kategorie
  const allFields = useMemo(() => {
    const base = cfg.baseFields ?? [];
    const cat = currentCat?.fields ?? [];
    return [...base, ...cat];
  }, [cfg.baseFields, currentCat]);

  // Senden → will hier nur was ausporbieren, später löschen
  async function onSubmit(values: FormShape) {
    setSnack({ open: true, msg: "Validierung OK – weiter zu Kontaktdaten", sev: "success" });
    setActive(1);
  }

// Konstante für API-Basis
const API_BASE = import.meta.env.VITE_API_BASE || "/api";

// Hilfen: Dateifeldnamen aus der gewählten Kategorie bestimmen
function fileFieldNamesForCategory(catKey: string): string[] {
  const cat = (formConfig as any).categories?.find((c: any) => c.key === catKey);
  if (!cat) return [];
  return (cat.fields || []).filter((f: any) => f.type === "file").map((f: any) => f.name);
}

// Prüfen, ob im Values-Objekt Dateien enthalten sind (File oder FileList)
function hasAnyFiles(values: Record<string, any>, fileFieldNames: string[]) {
  return fileFieldNames.some((name) => {
    const v = values?.[name];
    if (!v) return false;
    if (v instanceof File) return true;
    if (typeof FileList !== "undefined" && v instanceof FileList) return v.length > 0;
    // RHF kann auch Arrays von Files liefern
    if (Array.isArray(v)) return v.some((x) => x instanceof File);
    return false;
  });
}

// FormData aus den Values bauen (Textfelder + Dateien)
function buildFormData(values: Record<string, any>, fileFieldNames: string[]) {
  const fd = new FormData();

  // 1) Text-/Nicht-Dateifelder
  Object.entries(values).forEach(([k, v]) => {
    if (fileFieldNames.includes(k)) return; // Dateien separat anhängen
    if (v == null) return;
    if (Array.isArray(v)) {
      // Multiselect etc. → kommasepariert (Server splittet wieder)
      fd.append(k, v.join(","));
    } else {
      fd.append(k, String(v));
    }
  });

  // 2) Dateien
  for (const name of fileFieldNames) {
    const v = values[name];
    if (!v) continue;
    if (v instanceof File) {
      fd.append(name, v);
    } else if (typeof FileList !== "undefined" && v instanceof FileList) {
      Array.from(v).forEach((file) => fd.append(name, file));
    } else if (Array.isArray(v)) {
      v.filter((x) => x instanceof File).forEach((file: File) => fd.append(name, file));
    }
  }

  return fd;
}

async function submitFinal(values: any) {
  // 1) Dateifelder der aktiven Kategorie ermitteln
  const catKey = values?.category ?? "";
  const fileFields = fileFieldNamesForCategory(catKey);

  // 2) Entscheiden, ob multipart nötig ist:
  //    - wenn Dateien vorhanden SIND ⇒ FormData
  //    - oder wenn die Kategorie ÜBERHAUPT Dateifelder hat ⇒ ebenfalls FormData (robust ggü. späteren Uploads)
  const useMultipart = hasAnyFiles(values, fileFields) || fileFields.length > 0;

  try {
    let res: Response;

    if (useMultipart) {
      const fd = buildFormData(values, fileFields);
      res = await fetch(`${API_BASE}/tickets`, {
        method: "POST",
        body: fd, // KEINE headers/content-type hier setzen!
      });
    } else {
      // reine JSON-Variante (nur wenn die Kategorie garantiert keine Dateien kennt)
      res = await fetch(`${API_BASE}/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
    }

    if (res.ok) {
      setSnack({ open: true, msg: "Ticket erfolgreich versendet ✅", sev: "success" });
      form.reset();
      setActive(0);
      return;
    }

    // Fehlerbehandlung differenziert
    let payload: any = null;
    try { payload = await res.json(); } catch {}

    switch (res.status) {
      case 400: {
        // Server liefert: { error: 'Invalid Input', details: { fieldErrors, formErrors } }
        const fieldErrors = payload?.details?.fieldErrors || {};
        const formErrors = payload?.details?.formErrors || [];
        // RHF-Fehler setzen
        Object.entries(fieldErrors).forEach(([name, msgs]: any) => {
          const msg = Array.isArray(msgs) ? msgs[0] : String(msgs);
          form.setError(name as any, { type: "server", message: msg || "Ungültige Eingabe" });
        });
        if (formErrors.length) {
          setSnack({ open: true, msg: formErrors[0] || "Eingaben unvollständig/ungültig.", sev: "error" });
        } else {
          setSnack({ open: true, msg: "Eingaben unvollständig/ungültig.", sev: "error" });
        }
        break;
      }
      case 502:
        setSnack({ open: true, msg: "Mailversand fehlgeschlagen (SMTP).", sev: "error" });
        break;
      case 500:
        setSnack({ open: true, msg: "Serverfehler (500).", sev: "error" });
        break;
      default:
        setSnack({ open: true, msg: `Fehler: HTTP ${res.status}`, sev: "error" });
    }
  } catch (err) {
    // z. B. CORS/Netzwerk
    setSnack({ open: true, msg: "Netzwerkfehler beim Senden.", sev: "error" });
  }
}


  return (
    <Box sx={{ py: 6, bgcolor: "background.default" }}>
      {/* Außenrahmen: volle Breite erlauben, innen zentrieren */}
      <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <Paper
            elevation={3}
            sx={{
              width: "100%",
              maxWidth: 960,           // Zielbreite der Karte
              p: { xs: 2, md: 4 },
              mx: "auto",
              borderRadius: 3,
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar src={logoSrc} variant="rounded" sx={{ width: 56, height: 56 }} />
              <Box>
                <Typography variant="h5" fontWeight={700}>
                  Support-Ticket erstellen
                </Typography>
                <Typography color="text.secondary">
                  IT-Support Hochschule für Technik und Wirtschaft Berlin
                </Typography>
              </Box>
            </Stack>

            <Stepper activeStep={active} alternativeLabel sx={{ my: 3 }}>
              {steps.map((s) => (
                <Step key={s}>
                  <StepLabel>{s}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {active === 0 && (
              <FormProvider {...form}>
                <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
                  {/* Kategorie-Select außerhalb der Gruppen */}
                  <Grid container spacing={2} sx={{ mb: 1 }}>
                    <Grid item xs={12} md={6}>
                      <TextField select fullWidth label="Kategorie *" {...form.register("category")}>
                        {categories.map((c) => (
                          <MenuItem key={c.key} value={c.key}>
                            {c.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                  </Grid>

                  {/* Dynamik nach JSON: Step 1 */}
                  <GroupedFields fields={allFields} form={form} step={1} />

                  <Stack direction="row" justifyContent="flex-end" mt={3}>
                    <Button type="submit" variant="contained" endIcon={<span>→</span>}>
                      Weiter
                    </Button>
                  </Stack>
                </Box>
              </FormProvider>
            )}

            {active === 1 && (
              <Box>
                {/* Dynamik nach JSON: Step 2 */}
                <GroupedFields fields={allFields} form={form} step={2} />
                <Stack direction="row" justifyContent="space-between" mt={3}>
                  <Button onClick={() => setActive(0)}>Zurück</Button>
                  <Button variant="contained" onClick={() => setActive(2)}>
                    Weiter
                  </Button>
                </Stack>
              </Box>
            )}

            {active === 2 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Übersicht
                </Typography>
                {/* Werte anzeigen und final absenden */}
                <Stack direction="row" justifyContent="space-between" mt={2}>
                  <Button onClick={() => setActive(1)}>Zurück</Button>
                  <Button
                  variant="contained"
                  onClick={form.handleSubmit(submitFinal)}
                >
                  Absenden
                </Button>
                </Stack>
              </Box>
            )}
          </Paper>
        </Box>
      </Container>

      {snack.open && (
        <Snackbar
          open
          autoHideDuration={2500}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} // optional
        >
          <Alert severity={snack.sev} variant="filled">
            {snack.msg}
          </Alert>
        </Snackbar>
      )}
    </Box>
  );
}
