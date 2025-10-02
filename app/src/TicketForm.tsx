// app/src/TicketForm.tsx
import * as React from "react";
import { useMemo, useState, useEffect } from "react"; 
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
import {
  Box, Container, Paper, Stack, Typography, Avatar,
  Stepper, Step, StepLabel, Button, Snackbar, Alert, TextField, MenuItem, Grid, List, ListItem, ListItemText
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

// Eigene Step-Icon Komponente (wird aktuell nicht genutzt)
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
        return ""; // MUI-kompatibel
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

  const { watch, reset, getValues, register, trigger } = form;
  const currentKey = watch("category") || defaultCat;
  const currentCat: Category | undefined = categories.find((c) => c.key === currentKey);
  
  // Beim Kategorienwechsel die neu sichtbaren Felder mit sinnvollen Defaults belegen
  useEffect(() => { 
    const values = getValues();
    const merged = { ...defaultsForCategoryKey(currentKey), ...values, category: currentKey };
    reset(merged, { keepDirty: true, keepTouched: true }); 
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentKey]); 

  // --- Feldgruppen vorbereiten -----------------------------------
  const baseFields = useMemo(() => cfg.baseFields ?? [], [cfg.baseFields]);

  // Kontaktfeld-Namen automatisch erkennen (aus baseFields)
  const CONTACT_KEYS = useMemo(() => { 
    const keys = new Set<string>();
    (cfg.baseFields ?? []).forEach((f) => {
      const n = String(f?.name ?? "");
      const l = n.toLowerCase();
      if (["name", "fullname", "vorname", "nachname", "requestername"].includes(l)) keys.add(n);
      if (["email", "e-mail", "mail", "requesteremail"].includes(l) || f.type === "email") keys.add(n);
    });
    if (keys.size === 0) { keys.add("name"); keys.add("email"); } 
    return keys;
  }, [cfg.baseFields]);

  const contactNameKey = useMemo( 
    () => [...CONTACT_KEYS].find((k) => /name/i.test(k)) ?? "name",
    [CONTACT_KEYS]
  );
  const contactEmailKey = useMemo( 
    () => [...CONTACT_KEYS].find((k) => /(email|mail)/i.test(k)) ?? "email",
    [CONTACT_KEYS]
  );

  const baseNoContact = useMemo( 
    () => (cfg.baseFields ?? []).filter((f) => !CONTACT_KEYS.has(f.name)),
    [cfg.baseFields, CONTACT_KEYS]
  );

  const categoryFields = useMemo(() => currentCat?.fields ?? [], [currentCat]);
  const step1Fields = useMemo( 
    () => [...baseNoContact, ...categoryFields],
    [baseNoContact, categoryFields]
  );

  // Pflichtfelder für Step 1: Base (ohne Kontakt) + Kategorie
  const step1FieldNames = useMemo(() => { //NEU!
    const reqBase = baseNoContact.filter((f: any) => f.required === true).map((f: any) => f.name);
    const reqCat  = categoryFields.filter((f: any) => f.required === true).map((f: any) => f.name);
    return ["category", ...reqBase, ...reqCat];
  }, [baseNoContact, categoryFields]); 

  // Step 1 → nur diese Felder validieren, dann weiter
  async function nextFromStep1() { //NEU!
    const ok = await trigger(step1FieldNames as any);
    if (!ok) {
      setSnack({ open: true, msg: "Bitte Pflichtfelder prüfen.", sev: "error" });
      return;
    }
    setSnack({ open: true, msg: "Validierung OK – weiter zu Kontaktdaten", sev: "success" });
    setActive(1);
  }

  // Name/E-Mail (hart, aber RHF-registriert)
  const [contactTouched, setContactTouched] = useState({ name: false, email: false });
  const valuesAll = watch(); // re-render bei Feldänderungen
  const nameVal  = String(valuesAll?.[contactNameKey] ?? ""); 
  const emailVal = String(valuesAll?.[contactEmailKey] ?? ""); 
  const emailInvalid = emailVal.trim().length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal);

  function nextFromStep2() { 
    const nameOk = !!nameVal.trim();
    const emailOk = !!emailVal.trim() && !emailInvalid;
    setContactTouched({ name: true, email: true });
    if (!nameOk || !emailOk) {
      setSnack({ open: true, msg: "Bitte Name und gültige E-Mail eingeben.", sev: "error" });
      return;
    }
    setActive(2);
  }

  // Konstante für API-Basis
  const API_BASE = import.meta.env.VITE_API_BASE || "/api";

  // Dateifeldnamen aus der gewählten Kategorie bestimmen
  function fileFieldNamesForCategory(catKey: string): string[] {
    const cat = (formConfig as any).categories?.find((c: any) => c.key === catKey);
    if (!cat) return [];
    return (cat.fields || []).filter((f: any) => f.type === "file").map((f: any) => f.name);
  }

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

  // Nur die Keys senden, die das Backend erwartet (inkl. dynamischer Kontakt-Keys)
  function allowedKeysForCurrent() { //NEU!
    const base = (cfg.baseFields ?? []).map((f) => f.name);
    const cat  = (currentCat?.fields ?? []).map((f) => f.name);
    return new Set<string>(["category", ...base, ...cat, ...Array.from(CONTACT_KEYS)]);
  }

  // Feld-Def nach Name finden (aus Base + aktueller Kategorie)
  function getFieldDef(name: string) {
    const base = (cfg.baseFields ?? []).find((f) => f.name === name);
    if (base) return base;
    const cat = (currentCat?.fields ?? []).find((f) => f.name === name);
    return cat;
  }

  // Einzelwert normalisieren ("" → undefined, Zahlen parsen)
  function normalizeValue(key: string, val: any) { //NEU!
    const def = getFieldDef(key);
    const t = def?.type; // "text" | "number" | "multiselect" | "file" | "email" | ...
    if (val == null) return undefined;

    if (t === "number") {
      if (val === "" || Number.isNaN(Number(val))) return undefined;
      return typeof val === "number" ? val : Number(val);
    }

    if (Array.isArray(val)) {
      return val.length ? val : [];
    }

    if (typeof val === "string") {
      const s = val.trim();
      return s === "" ? undefined : s;
    }

    return val;
  }

  // Payload zusammenbauen (filtern + normalisieren)
  function buildPayload(values: Record<string, any>) { 
    const allow = allowedKeysForCurrent();
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(values)) {
      if (!allow.has(k)) continue;
      const norm = normalizeValue(k, v);
      if (norm !== undefined) out[k] = norm; // undefined-Keys gar nicht senden
    }
    return out;
  }

  async function submitFinal(values: any) {
    const payload = buildPayload(values); // gefiltert + normalisiert

    const catKey = payload?.category ?? "";
    const fileFields = fileFieldNamesForCategory(catKey);

    // Nur multipart, wenn wirklich Dateien vorhanden sind
    const useMultipart = hasAnyFiles(values, fileFields);

    try {
      let res: Response;
      if (useMultipart) {
        const fd = buildFormData(payload, fileFields);
        res = await fetch(`${API_BASE}/tickets`, { method: "POST", body: fd });
      } else {
        res = await fetch(`${API_BASE}/tickets`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        setSnack({ open: true, msg: "Ticket erfolgreich versendet ✅", sev: "success" });
        form.reset(buildInitialDefaults());
        setContactTouched({ name: false, email: false });
        setActive(0);
        return;
      }

      // Response lesen (JSON → Text-Fallback)
      let payloadJson: any = null, textFallback = "";
      try { payloadJson = await res.json(); } catch { try { textFallback = await res.text(); } catch {} }

      switch (res.status) {
        case 400: {
          const fieldErrors = payloadJson?.details?.fieldErrors || {};
          const formErrors = payloadJson?.details?.formErrors || [];
          Object.entries(fieldErrors).forEach(([name, msgs]: any) => {
            const msg = Array.isArray(msgs) ? msgs[0] : String(msgs);
            form.setError(name as any, { type: "server", message: msg || "Ungültige Eingabe" });
          });
          const firstMsg =
            (Array.isArray(formErrors) && formErrors[0]) ||
            payloadJson?.message ||
            textFallback ||
            "Eingaben unvollständig/ungültig.";
          setSnack({ open: true, msg: firstMsg, sev: "error" });
          break;
        }
        case 502:
          setSnack({ open: true, msg: "Mailversand fehlgeschlagen (SMTP).", sev: "error" });
          break;
        case 500:
          setSnack({ open: true, msg: "Serverfehler (500).", sev: "error" });
          break;
        default: {
          const msg = payloadJson?.message || textFallback || `Fehler: HTTP ${res.status}`;
          setSnack({ open: true, msg, sev: "error" });
          break;
        }
      }
    } catch (err) {
      console.error("Submit error:", err);
      setSnack({ open: true, msg: "Netzwerkfehler beim Senden.", sev: "error" });
    }
  }

  return (
    <Box sx={{ py: 6, bgcolor: "background.default" }}>
      <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <Paper
            elevation={3}
            sx={{
              width: "100%",
              maxWidth: 960,
              p: { xs: 2, md: 4 },
              mx: "auto",
              borderRadius: 3,
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  width: 112,
                  height: 64,
                  borderRadius: 2,
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                <img
                  src={logoSrc}
                  alt="HTW Logo"
                  draggable={false}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectPosition: "60% 120%",
                    transform: "translateX(-9%) scale(1.18)",
                    transformOrigin: "left center",
                    display: "block",
                  }}
                />
              </Box>

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
                "& .MuiStepIcon-root": { fontSize: "1.8rem" },
                "& .MuiStepLabel-label": { color: "#667085" },
                "& .Mui-active .MuiStepLabel-label": { color: "primary.main", fontWeight: 600 },
                "& .Mui-completed .MuiStepLabel-label": { color: "primary.main", fontWeight: 600 },
                "& .MuiStepIcon-text": { fill: "#fff", fontWeight: 700 },
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
                {/* kein handleSubmit; wir triggern gezielt nur Step-1-Felder */}
                <Box component="form" onSubmit={(e)=>{e.preventDefault(); nextFromStep1();}} noValidate>
                  {/* Kategorie-Select */}
                  <Grid container spacing={2} sx={{ mb: 1 }}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        select fullWidth label="Kategorie *" size="medium"
                        InputLabelProps={{ shrink: true }}
                        SelectProps={{
                          displayEmpty: true,
                          renderValue: (val) =>
                            val ? (categories.find(c=>c.key===val)?.label ?? val) : "Kategorie auswählen …"
                        }}
                        sx={{ 
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            backgroundColor: "#f9f9f9",
                            "&:hover": { backgroundColor: "#f1f1f1" },
                          },
                          "& fieldset": { borderRadius: 1 },
                          "& .MuiOutlinedInput-input": { py: 2.0, fontSize: "1.05rem" },
                          "& .MuiSelect-select": { py: 2.0, display: "flex", alignItems: "center" },
                          "& .MuiInputBase-root": { borderRadius: 3 }
                        }}
                        {...form.register("category")}
                      >
                        {categories.map((c) => (
                          <MenuItem key={c.key} value={c.key}>
                            {c.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                  </Grid>

                  {/* Step 1: Base (ohne Kontakt) + Kategorie-Felder */}
                  {selectedCategory ? (
                    <GroupedFields fields={step1Fields} form={form} step={1} />  
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      Bitte wählen Sie zuerst eine Kategorie aus, um das Formular anzuzeigen.
                    </Typography>
                  )} 

                  <Stack direction="row" justifyContent="flex-end" mt={3}>
                    <Button
                      sx={{ backgroundColor: '#7BB31A', color: '#fff', '&:hover': { backgroundColor: '#6aa115' } }}
                      type="submit" variant="contained" endIcon={<span>→</span>}
                    >
                      Weiter
                    </Button>
                  </Stack>
                </Box>
              </FormProvider>
            )}

            {active === 1 && (
              <FormProvider {...form}>
                <Box>
                  {/* Step 2: Kontaktfelder (dynamische Keys) */}
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth required label="Name *"
                        {...register(contactNameKey)} 
                        onBlur={() => setContactTouched((t)=>({...t, name:true}))}
                        error={contactTouched.name && !nameVal.trim()}
                        helperText={contactTouched.name && !nameVal.trim() ? "Name ist erforderlich" : " "}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth required label="E-Mail *"
                        {...register(contactEmailKey)} 
                        onBlur={() => setContactTouched((t)=>({...t, email:true}))}
                        error={contactTouched.email && (!emailVal.trim() || emailInvalid)}
                        helperText={
                          contactTouched.email && (!emailVal.trim() || emailInvalid)
                            ? "Gültige E-Mail erforderlich" : " "
                        }
                      />
                    </Grid>
                  </Grid>

                  <Stack direction="row" justifyContent="space-between" mt={3}>
                    <Button color="primary" onClick={() => setActive(0)}>Zurück</Button>
                    <Button
                      sx={{ backgroundColor: '#7BB31A', color: '#fff', '&:hover': { backgroundColor: '#6aa115' } }}
                      variant="contained" onClick={nextFromStep2}
                    >
                      Weiter
                    </Button>
                  </Stack>
                </Box>
              </FormProvider>
            )}

            {active === 2 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Übersicht
                </Typography>

                {/* Übersicht: Base (ohne Kontakt) + Kategorie + Kontakt */}
                <Grid container spacing={4} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={7}>
                    <Typography variant="subtitle1">Allgemein</Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText
                          primary="Kategorie"
                          secondary={categories.find(c=>c.key===valuesAll?.category)?.label
                            ?? valuesAll?.category ?? "—"}
                        />
                      </ListItem>

                      {baseNoContact.map(f => (
                        <ListItem key={`base-${f.name}`}>
                          <ListItemText
                            primary={f.label ?? f.name}
                            secondary={String(valuesAll?.[f.name] ?? "—")}
                          />
                        </ListItem>
                      ))}

                      {categoryFields.map(f => (
                        <ListItem key={`cat-${f.name}`}>
                          <ListItemText
                            primary={f.label ?? f.name}
                            secondary={String(valuesAll?.[f.name] ?? "—")}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>

                  <Grid item xs={12} md={5}>
                    <Typography variant="subtitle1">Kontaktdaten</Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText primary="Name"  secondary={nameVal || "—"} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="E-Mail" secondary={emailVal || "—"} />
                      </ListItem>
                    </List>
                  </Grid>
                </Grid>

                <Stack direction="row" justifyContent="space-between" mt={2}>
                  <Button
                    sx={{ backgroundColor: '#7BB31A', color: '#fff', '&:hover': { backgroundColor: '#6aa115' } }}
                    onClick={() => setActive(1)}
                  >
                    Zurück
                  </Button>
                  <Button
                    variant="contained"
                    sx={{ backgroundColor: '#7BB31A', color: '#fff', '&:hover': { backgroundColor: '#6aa115' } }}
                    onClick={() => submitFinal(form.getValues())}
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
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert severity={snack.sev} variant="filled">
            {snack.msg}
          </Alert>
        </Snackbar>
      )}
    </Box>
  );
}
