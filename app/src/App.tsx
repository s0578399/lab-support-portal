import React, { useMemo, useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Container,
  Card,
  CardContent,
  CardHeader,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Button,
  Box,
  Snackbar,
  Alert,
  Divider,
  Chip,
  CircularProgress,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import EmailIcon from "@mui/icons-material/Email";
import SendIcon from "@mui/icons-material/Send";
import BugReportIcon from "@mui/icons-material/BugReport";

// --- 1) Schema & Types ------------------------------------------------------
const TicketSchema = z.object({
  name: z.string().min(2, "Bitte gib deinen Namen an."),
  email: z.string().email("Bitte eine gültige E‑Mail angeben."),
  subject: z.string().min(5, "Bitte einen aussagekräftigen Betreff angeben."),
  category: z.enum(["incident", "service", "access", "other"], {
    required_error: "Bitte eine Kategorie wählen.",
  }),
  urgency: z.enum(["low", "medium", "high"], {
    required_error: "Bitte eine Priorität wählen.",
  }),
  description: z
    .string()
    .min(20, "Bitte beschreibe dein Anliegen (mind. 20 Zeichen)."),
});

// type TicketFormData = z.infer<typeof TicketSchema>  // (optional in TS)

// --- 2) Minimal API-Client --------------------------------------------------
async function submitTicket(payload) {
  // Falls du einen Proxy / Base-URL nutzt, hier anpassen (z. B. VITE_API_BASE_URL)
  const base = import.meta?.env?.VITE_API_BASE_URL || "";
  const res = await fetch(`${base}/api/tickets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `Request failed with ${res.status}`);
  }
  return res.json().catch(() => ({}));
}

// --- 3) App Theme -----------------------------------------------------------
function useAppTheme() {
  return useMemo(
    () =>
      createTheme({
        palette: {
          mode: "light",
          primary: { main: "#3f51b5" },
          secondary: { main: "#00b0ff" },
          background: { default: "#f6f8fb" },
        },
        shape: { borderRadius: 14 },
        typography: {
          fontFamily:
            "Inter, Roboto, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji'",
          h5: { fontWeight: 700 },
        },
        components: {
          MuiCard: { styleOverrides: { root: { boxShadow: "0 10px 30px rgba(0,0,0,0.06)" } } },
          MuiButton: { styleOverrides: { root: { textTransform: "none", borderRadius: 12 } } },
          MuiTextField: {
            defaultProps: { variant: "outlined", fullWidth: true },
          },
        },
      }),
    []
  );
}

// --- 4) Main UI -------------------------------------------------------------
export default function App() {
  const theme = useAppTheme();
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });
  const [submitting, setSubmitting] = useState(false);

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(TicketSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      category: "incident",
      urgency: "medium",
      description: "",
    },
  });

  async function onSubmit(values) {
    try {
      setSubmitting(true);
      const result = await submitTicket(values);
      setSnack({ open: true, message: "Ticket wurde gesendet – danke!", severity: "success" });
      reset();
      // Optional: result.id o.ä. anzeigen
    } catch (e) {
      setSnack({ open: true, message: `Senden fehlgeschlagen: ${e.message}`, severity: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="sticky" color="primary" elevation={0}>
        <Toolbar>
          <BugReportIcon sx={{ mr: 1 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Hochschul‑IT · Support‑Ticket (MVP)
          </Typography>
          <Chip icon={<EmailIcon />} label="E‑Mail Versand aktiv" variant="outlined" sx={{ color: "#fff", borderColor: "#fff" }} />
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Card>
          <CardHeader
            title="Ticket einreichen"
            subheader="Bitte fülle die Felder aus. Pflichtfelder sind markiert."
          />
          <Divider />
          <CardContent>
            <Box component="form" noValidate onSubmit={handleSubmit(onSubmit)}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="name"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Name"
                        required
                        error={!!errors.name}
                        helperText={errors.name?.message}
                        autoComplete="name"
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="E‑Mail"
                        required
                        error={!!errors.email}
                        helperText={errors.email?.message}
                        autoComplete="email"
                        type="email"
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Controller
                    name="subject"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Betreff"
                        required
                        error={!!errors.subject}
                        helperText={errors.subject?.message}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.category}>
                        <InputLabel id="category-label">Kategorie</InputLabel>
                        <Select
                          {...field}
                          labelId="category-label"
                          label="Kategorie"
                        >
                          <MenuItem value="incident">Störung / Incident</MenuItem>
                          <MenuItem value="service">Service Request</MenuItem>
                          <MenuItem value="access">Zugriff / Account</MenuItem>
                          <MenuItem value="other">Sonstiges</MenuItem>
                        </Select>
                        <FormHelperText>{errors.category?.message}</FormHelperText>
                      </FormControl>
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Controller
                    name="urgency"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.urgency}>
                        <InputLabel id="urgency-label">Priorität</InputLabel>
                        <Select {...field} labelId="urgency-label" label="Priorität">
                          <MenuItem value="low">Niedrig</MenuItem>
                          <MenuItem value="medium">Mittel</MenuItem>
                          <MenuItem value="high">Hoch</MenuItem>
                        </Select>
                        <FormHelperText>{errors.urgency?.message}</FormHelperText>
                      </FormControl>
                    )}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Beschreibung"
                        required
                        error={!!errors.description}
                        helperText={errors.description?.message}
                        multiline
                        minRows={5}
                        placeholder="Bitte beschreibe das Problem bzw. den Wunsch möglichst konkret."
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: "flex", gap: 2, justifyContent: { xs: "stretch", sm: "flex-end" } }}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      endIcon={submitting ? <CircularProgress size={18} /> : <SendIcon />}
                      disabled={!isValid || submitting}
                    >
                      {submitting ? "Senden…" : "Ticket senden"}
                    </Button>
                    <Button
                      type="button"
                      variant="outlined"
                      onClick={() => reset()}
                      disabled={submitting}
                    >
                      Zurücksetzen
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        </Card>
      </Container>

      <Snackbar
        open={snack.open}
        autoHideDuration={6000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          elevation={6}
          variant="filled"
          severity={snack.severity}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          sx={{ width: "100%" }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}
