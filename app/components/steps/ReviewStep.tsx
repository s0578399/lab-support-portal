// src/components/steps/ReviewStep.tsx
import React from "react";
import {
  Box,
  Grid,
  List,
  ListItem,
  ListItemText,
  Typography,
  Divider,
  Button,
} from "@mui/material";
import { TicketDetails } from "../../schema/ticket"; 
import { ContactValue } from "./ContactStep"; 

function Item({ label, value }: { label: string; value?: any }) { 
  return (
    <ListItem dense sx={{ px: 0 }}>
      <ListItemText primary={label} secondary={value || "—"} />
    </ListItem>
  );
}

export default function ReviewStep({
  ticket,
  contact,
  onEdit,
}: {
  ticket: TicketDetails;
  contact: ContactValue; 
  onEdit: (stepIndex: 0 | 1) => void; 
}) {
  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        Übersicht
      </Typography>
      <Divider sx={{ mb: 2 }} />

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">Allgemein</Typography>
            <Button size="small" onClick={() => onEdit(0)}>Bearbeiten</Button>
          </Box>
          <List>
            <Item label="Kategorie" value={ticket.category} />
            <Item label="Betreff" value={ticket.subject} />
            <Item label="Titel" value={ticket.title} />
            <Item label="Rolle" value={ticket.role} />
            <Item label="Kostenstelle" value={ticket.costCenter} />
            <Item label="Art des Antrags" value={ticket.requestType} />
            <Item label="Priorität" value={ticket.priority} />
            <Item label="Fälligkeitsdatum" value={ticket.dueDate || "—"} />
          </List>

          <Typography variant="h6" sx={{ mt: 2 }}>
            Beschreibung
          </Typography>
          <List>
            <Item label="Beschreibung" value={ticket.description} />
            <Item label="Begründung / Bedarf" value={ticket.justification} />
            <Item label="Anzahl / Menge" value={ticket.quantity} />
            <Item label="Einheit" value={ticket.unit} />
          </List>
        </Grid>

        <Grid item xs={12} md={6}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">Kontaktdaten</Typography>
            <Button size="small" onClick={() => onEdit(1)}>Bearbeiten</Button>
          </Box>
          <List>
            <Item label="Name" value={contact.name} />
            <Item label="E-Mail" value={contact.email} />
          </List>
        </Grid>
      </Grid>
    </Box>
  );
}
