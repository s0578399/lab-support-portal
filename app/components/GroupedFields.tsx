import * as React from "react";
import { Grid, Typography, Divider, Box } from "@mui/material";
import type { Field } from "../src/lib/formSchema";
import { layoutForField } from "../src/lib/formSchema";
import JsonFormRenderer from "./JsonFormRenderer";
import { UseFormReturn } from "react-hook-form";

type Props<T extends Record<string, any>> = {
  fields: Field[];
  form: UseFormReturn<T>;
  step: number;
};

export default function GroupedFields<T extends Record<string, any>>({ fields, form, step }: Props<T>) {
  // Filter auf Step und nach Section gruppieren
  const bySection = React.useMemo(() => {
    const map = new Map<string, { section: string; items: Field[] }>();
    fields
      .filter(f => (f.step ?? 1) === step)
      .forEach(f => {
        const sec = layoutForField(f).section;
        if (!map.has(sec)) map.set(sec, { section: sec, items: [] });
        map.get(sec)!.items.push(f);
      });
    return Array.from(map.values());
  }, [fields, step]);

  if (bySection.length === 0) return null;

  return (
    <Box>
      {bySection.map((group, idx) => (
        <Box key={group.section} sx={{ mt: idx === 0 ? 0 : 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>{group.section}</Typography>
          {idx > 0 && <Divider sx={{ mb: 2 }} />}
          <Grid container spacing={2}>
            {group.items.map((f) => {
              const { col } = layoutForField(f);
              return (
                <Grid key={f.name} item xs={12} md={col}>
                  <JsonFormRenderer fields={[f]} form={form} />
                </Grid>
              );
            })}
          </Grid>
        </Box>
      ))}
    </Box>
  );
}
