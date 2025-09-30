// app/src/TicketForm.tsx
import * as React from "react";
import { useMemo, useState, useEffect } from "react"; 
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
import {
  Box, Container, Paper, Stack, Typography, Avatar,
  Stepper, Step, StepLabel, Button, Snackbar, Alert, TextField, MenuItem, Grid
} from "@mui/material";
import StepConnector, { stepConnectorClasses } from "@mui/material/StepConnector";
import { styled } from "@mui/material/styles";
// Logo aus public/ verwenden (Datei: /public/htw-logo.jpg)
const logoSrc = "/HTW_Logo.jpg"; 

import formConfig from "../config/form.schema.json";
import type { FormConfig, Category } from "./lib/formSchema";
import { buildClientSchema } from "./lib/formSchema";
import GroupedFields from "../components/GroupedFields";

type FormShape = Record<string, any>;

// Eigene Step-Icon Komponente (weiß/grün aktiv, grau inaktiv)
function NumberStepIcon(props: any) { 
  const { active, completed, icon, className } = props; 
  const isOn = !!active || !!completed; 
  return ( 
    <Box 
      className={className} 
      sx={(theme) => ({ 
        width: 28, height: 28, borderRadius: "50%", display: "inline-flex", 
        alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600,
        backgroundColor: isOn ? "#FFFFFF" : "#F2F4F7", 
        border: isOn ? `2px solid ${theme.palette.primary.main}` : "1.5px solid #98A2B3", 
        color: "white", 
      })} 
    > 
      {icon} 
    </Box> 
  );
} 

// Connector-Linie grau inaktiv, grün aktiv/completed
const StepConnectorGreen = styled(StepConnector)(({ theme }) => ({ 
  [`.${stepConnectorClasses.line}`]: { 
    borderColor: "#D0D5DD",
    borderTopWidth: 2, 
    borderRadius: 1, 
  },
  [`&.${stepConnectorClasses.active} .${stepConnectorClasses.line}`]: { 
    borderColor: theme.palette.primary.main, 
  }, 
  [`&.${stepConnectorClasses.completed} .${stepConnectorClasses.line}`]: { 
    borderColor: theme.palette.primary.main, 
  }, 
})); 

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

  // Default-Werte-Builder (verhindert undefined) ======
  function makeDefaultByType(t: string) {
    switch (t) {
      case "number":
        return ""; // Zahlen beginnen ab leeren String beginnen (MUI-kompatibel)
      case "multiselect":
        return []; 
      case "file":
        return null;
      default:
        return ""; 
    }
  }

  function defaultsForCategoryKey(catKey: string) { 
    const cat = categories.find((c) => c.key === catKey);
    const obj: Record<string, any> = {};
    (cat?.fields ?? []).forEach((f) => { obj[f.name] = makeDefaultByType(f.type); });
    return obj;
  }

  function buildInitialDefaults() { 
    const base: Record<string, any> = {};
    (cfg.baseFields ?? []).forEach((f) => { base[f.name] = makeDefaultByType(f.type); });
    return { category: defaultCat, ...base, ...defaultsForCategoryKey(defaultCat) };
  }
  // ================================================================

  const form = useForm<FormShape>({
  resolver: zodResolver(ClientSchema),
  defaultValues: buildInitialDefaults(),
  mode: "onSubmit",
  });

// außerhalb der useForm-Konfiguration
const selectedCategory = form.watch("category");

  const { handleSubmit, watch, reset, getValues } = form; 
  const currentKey = watch("category") || defaultCat;
  const currentCat: Category | undefined = categories.find((c) => c.key === currentKey);

  // Beim Kategorienwechsel die neu sichtbaren Felder mit sinnvollen Defaults belegen
  useEffect(() => { 
    const values = getValues();
    const merged = { ...defaultsForCategoryKey(currentKey), ...values, category: currentKey };
    reset(merged, { keepDirty: true, keepTouched: true }); 
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentKey]); 

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
        res = await fetch(`${API_BASE}/tickets`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
      }

      if (res.ok) {
        setSnack({ open: true, msg: "Ticket erfolgreich versendet ✅", sev: "success" });
        form.reset(buildInitialDefaults()); //NEU! sauber zurücksetzen
        setActive(0);
        return;
      }

      // Fehlerbehandlung differenziert
      let payload: any = null;
      try { payload = await res.json(); } catch {}

      switch (res.status) {
        case 400: {
          const fieldErrors = payload?.details?.fieldErrors || {};
          const formErrors = payload?.details?.formErrors || [];
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

            <Stepper
              activeStep={active}
              alternativeLabel
              connector={<StepConnectorGreen />}
              sx={{
                my: 3,
                "& .MuiStepIcon-root": {
                  fontSize: "1.8rem",             
                },
                "& .MuiStepLabel-label": { color: "#667085" },
                "& .Mui-active .MuiStepLabel-label": { color: "primary.main", fontWeight: 600 },
                "& .Mui-completed .MuiStepLabel-label": { color: "primary.main", fontWeight: 600 },
                "& .MuiStepIcon-text": {
                  fill: "#fff",                     
                  fontWeight: 700,
    },
              }}
            >
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
                      <TextField select fullWidth label="Kategorie *" size="medium"
                      InputLabelProps={{ shrink: true }}
                      SelectProps={{ displayEmpty: true, renderValue: (val) => val ? (categories.find(c=>c.key===val)?.label ?? val) : "Kategorie auswählen …" }}
                      sx={{ 
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,                   
                          backgroundColor: "#f9f9f9",       
                          "&:hover": { backgroundColor: "#f1f1f1" },  // Hover-Effekt
                        },
                        "& fieldset": {
                          borderRadius: 1,             // NEU! wichtig: auch Fieldset abrunden
                        },
                        "& .MuiOutlinedInput-input": { py: 2.0, fontSize: "1.05rem" }, "& .MuiSelect-select": { py: 2.0, display: "flex", alignItems: "center" }, "& .MuiInputBase-root": { borderRadius: 3 } }}
                      {...form.register("category")}>

                        {categories.map((c) => (
                          <MenuItem key={c.key} value={c.key}>
                            {c.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                  </Grid>

                  {/* Dynamik nach JSON: Step 1 */}
                  {selectedCategory ? (
                  <GroupedFields fields={allFields} form={form} step={1} />
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Bitte wählen Sie zuerst eine Kategorie aus, um das Formular anzuzeigen.
                  </Typography>
                )} 

                  <Stack direction="row" justifyContent="flex-end" mt={3}>
                    <Button sx={{
                      backgroundColor: '#7BB31A',
                      color: '#fff',
                      '&:hover': { backgroundColor: '#6aa115' }
                    }} type="submit" variant="contained" endIcon={<span>→</span>}>
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
                  <Button color="primary" onClick={() => setActive(0)}>Zurück</Button>
                  <Button sx={{
                    backgroundColor: '#7BB31A',
                    color: '#fff',
                    '&:hover': { backgroundColor: '#6aa115' }
                  }} variant="contained" onClick={() => setActive(2)}>
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
                  <Button sx={{
                    backgroundColor: '#7BB31A',
                    color: '#fff',
                    '&:hover': { backgroundColor: '#6aa115' }
                  }} onClick={() => setActive(1)}>Zurück</Button>
                  <Button
                    variant="contained"
                    sx={{
                      backgroundColor: '#7BB31A',
                      color: '#fff',
                      '&:hover': { backgroundColor: '#6aa115' }
                    }}
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
