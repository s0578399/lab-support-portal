// app/src/TicketForm.tsx
import * as React from "react";
import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
import {
  Box, Container, Paper, Stack, Typography, Avatar,
  Stepper, Step, StepLabel, Button, Snackbar, Alert, TextField, MenuItem, Grid
} from "@mui/material";
// ⚠️ Logo aus public/ verwenden (Datei: /public/htw-logo.jpg)
//    Bitte Leerzeichen aus Dateinamen entfernen, dann:
const logoSrc = "/htw-logo.jpg";

import formConfig from "../../config/form.schema.json";
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

  // 💡 Alle Felder: Base + aktuelle Kategorie
  const allFields = useMemo(() => {
    const base = cfg.baseFields ?? [];
    const cat = currentCat?.fields ?? [];
    return [...base, ...cat];
  }, [cfg.baseFields, currentCat]);

  // Senden → hier nur Demo (Snackbar). Dein echter Submit: /api/tickets
  async function onSubmit(values: FormShape) {
    setSnack({ open: true, msg: "Validierung OK – weiter zu Kontaktdaten", sev: "success" });
    setActive(1);
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
              maxWidth: 960,           // 👈 Zielbreite der Karte
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
                  <Button variant="contained">Absenden</Button>
                </Stack>
              </Box>
            )}
          </Paper>
        </Box>
      </Container>

      <Snackbar open={snack.open} autoHideDuration={2500} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert severity={snack.sev} variant="filled">
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
