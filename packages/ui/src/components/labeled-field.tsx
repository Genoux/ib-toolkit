import { Field, FieldContent, FieldLabel } from "./field";
import { cn } from "../lib/utils";

interface LabeledFieldProps {
  label: string;
  value?: React.ReactNode;
  className?: string;
}

export function LabeledField({ label, value, className }: LabeledFieldProps) {
  if (!value) return null;
  return (
    <Field className={cn("flex flex-col items-start justify-between gap-2", className)}>
      <FieldLabel className="text-xs text-muted-foreground">{label}</FieldLabel>
      <FieldContent className="text-sm font-medium text-foreground">{value}</FieldContent>
    </Field>
  );
}
