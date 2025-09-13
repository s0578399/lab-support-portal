import { useMemo, useState } from 'react';
import { ThemeProvider, CssBaseline, Container, AppBar, Toolbar, Typography, Snackbar, Alert, Card, CardHeader, CardContent, Box } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import TicketForm from './TicketForm';
import { theme as baseTheme } from './theme';

export default function App() {
  const theme = useMemo(() => createTheme(baseTheme), []);
  const [snack, setSnack] = useState<{open: boolean; message: string; severity: 'success' | 'error'}>({ open: false, message: '', severity: 'success' });

  return (
     <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">Prototyp für Formularlogik</Typography>
        </Toolbar>
      </AppBar>

      {/* Vollflächiger Center-Wrapper */}
      <Box
        sx={(t) => ({
          minHeight: `calc(100vh - ${t.mixins.toolbar.minHeight ?? 64}px)`,
          display: 'grid',
          placeItems: 'center',
          px: 2,
          bgcolor: 'background.default'
        })}
      >
        <Card sx={{ maxWidth: 640, justifySelf: 'center' }}>
          <CardHeader title="Ticket erstellen" subheader="Bitte alle Pflichtfelder ausfüllen." />
          <CardContent>
            <TicketForm
              onSuccess={() => setSnack({ open: true, message: 'Ticket gesendet ✅', severity: 'success' })}
              onError={(m) => setSnack({ open: true, message: `Fehler: ${m}`, severity: 'error' })}
            />
          </CardContent>
        </Card>
      </Box>

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
