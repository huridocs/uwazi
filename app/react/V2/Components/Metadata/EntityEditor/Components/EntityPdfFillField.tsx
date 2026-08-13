import React from 'react';
import type { FieldValues, Path, PathValue, UseFormSetValue } from 'react-hook-form';
import { EntityField } from './EntityField.js';
import { EntityPdfFill } from './EntityPdfFill.js';
import type { PdfFillPlacement, PdfFillTarget } from './pdfFillTypes.js';

type EntityPdfFillFieldProps<TFormValues extends FieldValues> = {
  field: Path<TFormValues>;
  setValue: UseFormSetValue<TFormValues>;
  disabled?: boolean;
  placement?: PdfFillPlacement;
  pdfFill?: PdfFillTarget;
  children: (overlay?: React.ReactNode) => React.ReactNode;
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
  disabled,
  placement,
  pdfFill,
  children,
}: EntityPdfFillFieldProps<TFormValues>) => (
  <EntityField>
    {pdfFill ? (
      <EntityPdfFill
        target={pdfFill}
        disabled={disabled}
        placement={placement}
        applyValue={value => applyPdfFillFormValue(setValue, field, value)}
      >
        {overlay => children(overlay)}
      </EntityPdfFill>
    ) : (
      children()
    )}
  </EntityField>
);

export { EntityPdfFillField, applyPdfFillFormValue };
export type { PdfFillTarget };
