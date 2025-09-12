import { useMemo, useState } from 'react';
import { ThemeProvider, CssBaseline, Container, AppBar, Toolbar, Typography, Snackbar, Alert, Card, CardHeader, CardContent } from '@mui/material';
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
          <Typography variant="h6">Support-Ticket</Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Card>
          <CardHeader title="Ticket erstellen" subheader="Bitte alle Pflichtfelder ausfüllen." />
          <CardContent>
            <TicketForm
              onSuccess={() => setSnack({ open: true, message: 'Ticket gesendet ✅', severity: 'success' })}
              onError={(m) => setSnack({ open: true, message: `Fehler: ${m}`, severity: 'error' })}
            />
          </CardContent>
        </Card>
      </Container>
      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(s => ({ ...s, open: false }))}>
        <Alert onClose={() => setSnack(s => ({ ...s, open: false }))} severity={snack.severity} variant="filled" sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}
