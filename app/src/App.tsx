import { Container, Box, Typography, Paper } from '@mui/material';
import { TicketForm } from './TicketForm';

export default function App() {
  return (
    <Container maxWidth="md">
      <Box py={4}>
        <Typography variant="h4" gutterBottom>Ticket erstellen</Typography>
        <Paper sx={{ p: 3 }}>
          <TicketForm />
        </Paper>
      </Box>
    </Container>
  );
}
