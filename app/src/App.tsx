// app/src/App.tsx
import { useMemo, useState } from 'react';
import {
  ThemeProvider, CssBaseline, AppBar, Toolbar,
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

      

      {/* Zentrierter Seiten-Wrapper */}
      <Box
        sx={{
        flex: 1,                      // nimmt den ganzen verbleibenden Platz
        display: "flex",
        justifyContent: "center",     // horizontal zentriert
        alignItems: "center",         // vertikal zentriert
        p: { xs: 2, sm: 3 },
        }}
      >
        {/* TicketForm rendert seine eigene Paper-Karte mit maxWidth ~960 */}
        <TicketForm
          onSuccess={() =>
            setSnack({ open: true, message: 'Ticket gesendet ✅', severity: 'success' })
          }
          onError={(m: string) =>
            setSnack({ open: true, message: `Fehler: ${m}`, severity: 'error' })
          }
        />
      </Box>

      {snack.open && (
        <Snackbar
          open
          autoHideDuration={4000}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
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
      )}
    </ThemeProvider>
  );
}
