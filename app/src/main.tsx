import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { GlobalStyles } from "@mui/material";



import { CssBaseline, ThemeProvider, createTheme } from '@mui/material' 
// MUI-Theme mit Roboto/Helvetica/Arial-Stack wie im Screenshot
const theme = createTheme({
  typography: {
    fontFamily: [
      'Roboto',
      'Helvetica',
      'Arial',
      'sans-serif',
      'Apple Color Emoji',
      'Segoe UI Emoji',
      'Segoe UI Symbol',
    ].join(','),
    h4: { fontWeight: 600 }, // Überschrift "Support-Ticket erstellen"
    h6: { fontWeight: 600 }, // Abschnittsüberschriften/Stepper
    button: { textTransform: 'none', fontWeight: 600 }, // Buttons wie "Weiter"
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {}
    <ThemeProvider theme={theme}>
      {/* setzt saubere Defaults (Typo, Reset etc.) */}
      <CssBaseline />
      {/* kleine Feintunings für Labels/Inputs/Buttons */}
      <GlobalStyles
        styles={{
          body: { fontFamily: theme.typography.fontFamily },
          '.MuiFormLabel-root': { fontWeight: 500 },
          '.MuiInputBase-input, .MuiSelect-select': { fontWeight: 400 },
          '.MuiButton-root': { fontWeight: 600, textTransform: 'none' },
        }}
      />
      <App />
    </ThemeProvider>
  </StrictMode>,
)
