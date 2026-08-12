import type { FieldValues, Path, PathValue, UseFormSetValue } from 'react-hook-form';

const applyPdfFillFormValue = <TFormValues extends FieldValues>(
  setValue: UseFormSetValue<TFormValues>,
  field: Path<TFormValues>,
  value: string | number
) => {
  setValue(field, value as PathValue<TFormValues, Path<TFormValues>>, { shouldDirty: true });
};

export { applyPdfFillFormValue };
