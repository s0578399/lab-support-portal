// app/src/components/JsonFormRenderer.tsx
import { TextField, MenuItem, Box, Chip } from '@mui/material';
import { UseFormRegister, FieldErrors, Control, useWatch } from 'react-hook-form';

type Props = {
  fields: any[];
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  control: Control<any>;
};

export default function JsonFormRenderer({ fields, register, errors, control }: Props) {
  const values = useWatch({ control });

  const isVisible = (f: any) => {
    if (!f.showIf) return true;
    return values?.[f.showIf.field] === f.showIf.eq;
  };

  return (
    <>
      {fields.filter(isVisible).map((f) => {
        const err = (errors as any)?.[f.name]?.message as string | undefined;

        if (f.type === 'select') {
          const opts = (f.options ?? []).map((o: any) => typeof o === 'string' ? {value:o, label:o} : o);
          return (
            <TextField key={f.name} select label={f.label} {...register(f.name)} error={!!err} helperText={err} fullWidth required={!!f.required}>
              {opts.map((o: any) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </TextField>
          );
        }

        if (f.type === 'multiselect') {
          const opts = (f.options ?? []).map((o: any) => typeof o === 'string' ? {value:o, label:o} : o);
          return (
            <TextField
              key={f.name}
              select
              label={f.label}
              SelectProps={{
                multiple: true,
                renderValue: (sel) => <Box sx={{display:'flex', gap:1, flexWrap:'wrap'}}>{(sel as string[]).map(s => <Chip key={s} label={s}/>)}</Box>
              }}
              {...register(f.name)}
              error={!!err}
              helperText={err}
              fullWidth
              required={!!f.required}
            >
              {opts.map((o: any) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </TextField>
          );
        }

        if (f.type === 'textarea') {
          return (
            <TextField key={f.name} label={f.label} {...register(f.name)} error={!!err} helperText={err} fullWidth multiline minRows={4} required={!!f.required}/>
          );
        }

        if (f.type === 'number') {
          return (
            <TextField key={f.name} label={f.label} type="number" {...register(f.name, { valueAsNumber: true })} error={!!err} helperText={err} fullWidth required={!!f.required}/>
          );
        }

        if (f.type === 'date') {
          return (
            <TextField key={f.name} label={f.label} type="date" InputLabelProps={{ shrink: true }} {...register(f.name)} error={!!err} helperText={err} fullWidth required={!!f.required}/>
          );
        }

        if (f.type === 'file') {
          return (
            <div key={f.name}>
              <label>{f.label}{f.required ? ' *' : ''}</label><br/>
              <input type="file" {...register(f.name as any)} />
              {err && <div style={{color:'crimson'}}>{err}</div>}
            </div>
          );
        }

        // default text/email/url
        return (
          <TextField key={f.name} label={f.label} {...register(f.name)} error={!!err} helperText={err} fullWidth required={!!f.required}/>
        );
      })}
    </>
  );
}
