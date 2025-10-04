// app/components/SelectButton.tsx  
import * as React from 'react'; 
import ToggleButton, { ToggleButtonProps } from '@mui/material/ToggleButton'; 
import { styled } from '@mui/material/styles';

const SelectButtonRoot = styled(ToggleButton)(({ theme }) => ({
  textTransform: 'none',          
  borderRadius: 999,              
  padding: '8px 14px',            
  borderWidth: 1.5,             
  boxShadow: 'none',         
  borderColor: '#D0D5DD',           // dunkelgrauer Rand
  backgroundColor: '#F2F4F7',       // hellgraue Füllung
  color: '#344054',                 // dunkle Schrift
  '&:hover': {                      //
    backgroundColor: '#E5E7EB',     //
    borderColor: '#D0D5DD',         //
  },
  '&.Mui-selected': {               //Zustand: AUSGEWÄHLT
    backgroundColor: '#FFFFFF',     // weiße Füllung
    borderColor: theme.palette.primary.main, // grüner Rand
    color: theme.palette.primary.main,       // grüne Schrift
  },
  '&.Mui-selected:hover': {         
    backgroundColor: '#FFFFFF',    
    borderColor: theme.palette.primary.main, 
  },
}));

export default function SelectButton(props: ToggleButtonProps) { 
  return <SelectButtonRoot disableRipple {...props} />;         
}
