// app/components/NumberStepIcon.tsx  
import * as React from 'react'; 
import Box from '@mui/material/Box';
import { StepIconProps } from '@mui/material/StepIcon'; 
import { useTheme } from '@mui/material/styles'; 

export default function NumberStepIcon(props: StepIconProps) {
  const { active, completed, icon, className } = props; 
  const theme = useTheme(); 
  const green = theme.palette.primary.main;
  const isOn = active || completed;

  return ( 
    <Box 
      className={className} 
      sx={{ 
        width: 28, 
        height: 28,
        borderRadius: '50%', 
        display: 'inline-flex', 
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 14,
        fontWeight: 600, 
        backgroundColor: isOn ? '#FFFFFF' : '#F2F4F7',
        border: isOn ? `2px solid ${green}` : '1.5px solid #98A2B3',
        color: isOn ? green : '#344054',
      }}
    > 
      {icon} 
    </Box>
  );
}
