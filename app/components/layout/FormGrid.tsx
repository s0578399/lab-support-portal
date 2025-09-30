
//NEU! app/components/layout/FormGrid.tsx
import * as React from "react";
import Grid from "@mui/material/Grid";

export type LayoutHint = {
  xs?: 12 | 6 | 4 | 3 | 2;
  sm?: 12 | 6 | 4 | 3 | 2;
  md?: 12 | 6 | 4 | 3 | 2;
  lg?: 12 | 6 | 4 | 3 | 2;
};

export type FieldNode = {
  name: string;
  ui?: { layout?: LayoutHint };
};

type Props = {
  fields: FieldNode[];
  renderField: (f: FieldNode) => React.ReactNode;
};

function getSpan(f: FieldNode) {
  const l = f.ui?.layout ?? {};
  //NEU! – Fallbacks: auf md=6 (Halbspalte) und lg=6 für ein sauberes Raster
  return {
    xs: l.xs ?? 12,
    sm: l.sm ?? 12,
    md: l.md ?? 6,
    lg: l.lg ?? 6,
  };
}

export default function FormGrid({ fields, renderField }: Props) {
  return (
    <Grid container spacing={2} columns={12}>
      {fields.map((f) => {
        const span = getSpan(f);
        return (
          <Grid key={f.name} item xs={span.xs} sm={span.sm} md={span.md} lg={span.lg}>
            {renderField(f)}
          </Grid>
        );
      })}
    </Grid>
  );
}
