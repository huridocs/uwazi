import React from 'react';
import type { FieldValues, Path, PathValue, UseFormSetValue } from 'react-hook-form';
import { EntityField } from './EntityField.js';
import { EntityPdfFill, type EntityPdfFillSlot } from './EntityPdfFill.js';
import type { PdfFillPlacement, PdfFillTarget } from './pdfFillTypes.js';

type EntityPdfFillFieldProps<TFormValues extends FieldValues> = {
  field: Path<TFormValues>;
  setValue: UseFormSetValue<TFormValues>;
  label: string;
  disabled?: boolean;
  placement?: PdfFillPlacement;
  pdfFill?: PdfFillTarget;
  children: (slot?: EntityPdfFillSlot) => React.ReactNode;
};

const applyPdfFillFormValue = <TFormValues extends FieldValues>(
  setValue: UseFormSetValue<TFormValues>,
  field: Path<TFormValues>,
  value: string | number
) => {
  setValue(field, value as PathValue<TFormValues, Path<TFormValues>>, { shouldDirty: true });
};

const EntityPdfFillField = <TFormValues extends FieldValues>({
  field,
  setValue,
  label,
  disabled,
  placement,
  pdfFill,
  children,
}: EntityPdfFillFieldProps<TFormValues>) => (
  <EntityField>
    {pdfFill ? (
      <EntityPdfFill
        target={pdfFill}
        label={label}
        disabled={disabled}
        placement={placement}
        applyValue={value => applyPdfFillFormValue(setValue, field, value)}
      >
        {slot => children(slot)}
      </EntityPdfFill>
    ) : (
      children()
    )}
  </EntityField>
);

export { EntityPdfFillField };
export type { PdfFillTarget, PdfFillPlacement };
