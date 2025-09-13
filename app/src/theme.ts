import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    primary: { main: "#7bb61c" },    // HTW-Grün (Beispiel)
    background: { default: "#f5fbf2" }
  },
  shape: { borderRadius: 16 },
  components: {
    MuiPaper: { styleOverrides: { root: { borderRadius: 20 } } },
    MuiButton: { styleOverrides: { root: { borderRadius: 16, textTransform: "none" } } },
    MuiTextField: { defaultProps: { margin: "normal", variant: "outlined", fullWidth: true } },
  }
});
