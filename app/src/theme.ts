import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  cssVariables: true,
  colorSchemes: {
    light: { palette: { primary: { main: '#6750A4' } } },
    dark:  { palette: { primary: { main: '#D0BCFF' } } }
  },
  shape: { borderRadius: 12 }
});
