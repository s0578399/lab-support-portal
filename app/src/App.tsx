// app/src/App.tsx
import { useMemo, useState } from 'react';
import {
  ThemeProvider, CssBaseline, Container, AppBar, Toolbar,
  Typography, Snackbar, Alert, Box
} from '@mui/material';
import { createTheme } from '@mui/material/styles';
import TicketForm from './TicketForm';
import { theme as baseTheme } from './theme';

export default function App() {
  const theme = useMemo(() => createTheme(baseTheme), []);
  const [snack, setSnack] = useState<{
    open: boolean; message: string; severity: 'success' | 'error'
  }>({ open: false, message: '', severity: 'success' });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">Prototyp für Formularlogik</Typography>
        </Toolbar>
      </AppBar>

      {/* Zentrierter Seiten-Wrapper */}
      <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3 }, py: { xs: 3, md: 5 }, bgcolor: 'background.default' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          {/* TicketForm rendert seine eigene Paper-Karte mit maxWidth ~960 */}
          <TicketForm
            onSuccess={() => setSnack({ open: true, message: 'Ticket gesendet ✅', severity: 'success' })}
            onError={(m: string) => setSnack({ open: true, message: `Fehler: ${m}`, severity: 'error' })}
          />
        </Box>
      </Container>

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
      >
        <Alert
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          severity={snack.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}
