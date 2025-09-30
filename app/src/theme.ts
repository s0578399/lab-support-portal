import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    primary: { main: "#7bb61c" },    // HTW-Grün 
    contrastText: '#fff',
    background: { default: '#F6FBF9' }, // seichter Türkis global
  },
  typography: {
    // Roboto + sichere Fallbacks (Material-Design-Stack)
    fontFamily: [
      'Roboto',
      'Helvetica',
      'Arial',
      'sans-serif',
      // optional: System-Fonts als letzte Fallbacks
      'Apple Color Emoji',
      'Segoe UI Emoji',
      'Segoe UI Symbol',
    ].join(','),
    //optionale Feintuning-Werte nah am Screenshot (kannst du lassen)
    h4: { fontWeight: 600 }, // "Support-Ticket erstellen"
    h6: { fontWeight: 600 }, // Abschnittstitel/Stepper
    button: { textTransform: 'none', fontWeight: 600 }, // „Weiter“-Button
  },
  shape: { borderRadius: 16 },
  components: {
    MuiPaper: { styleOverrides: { root: { borderRadius: 20 } } },
    MuiButton: { styleOverrides: { root: { borderRadius: 16, textTransform: "none" } } },
    MuiTextField: { defaultProps: { margin: "normal", variant: "outlined", fullWidth: true } },
  }
});
