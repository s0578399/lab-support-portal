import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { TextField, Button, Stack } from '@mui/material';
import axios from 'axios';

const schema = z.object({
  betreff: z.string().min(3, 'Bitte mindestens 3 Zeichen.')
});

type FormValues = z.infer<typeof schema>;

export function TicketForm() {
  const { control, handleSubmit, formState: { isSubmitting } } =
    useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { betreff: '' } });

  const onSubmit = async (values: FormValues) => {
    // Minimaler Test-Call an die API (bauen wir unten)
    await axios.post('/api/send-ticket', {
      ticketType: 'test',
      payload: values
    });
    alert('Gesendet!');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack spacing={2}>
        <Controller
          name="betreff"
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              label="Betreff (Test)"
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              fullWidth
            />
          )}
        />
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          Absenden
        </Button>
      </Stack>
    </form>
  );
}
