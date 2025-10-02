// app/components/StepConnectorGreen.tsx 
import { styled } from '@mui/material/styles'; 
import StepConnector, { stepConnectorClasses } from '@mui/material/StepConnector'; 

const StepConnectorGreen = styled(StepConnector)(({ theme }) => ({ 
  [`& .${stepConnectorClasses.line}`]: { 
    borderColor: '#D0D5DD', // inaktiv grau 
    borderTopWidth: 2,
    borderRadius: 1,
  }, 
  [`&.${stepConnectorClasses.active} .${stepConnectorClasses.line}`]: { 
    borderColor: theme.palette.primary.main, // aktiv grün 
  }, 
  [`&.${stepConnectorClasses.completed} .${stepConnectorClasses.line}`]: { 
    borderColor: theme.palette.primary.main, // completed grün
  }, 
})); 

export default StepConnectorGreen; 
