import React, { useCallback } from 'react';
import {
  FieldValues,
  Path,
  PathValue,
  RegisterOptions,
  useFormContext,
  useFormState,
} from 'react-hook-form';
import { Translate } from '#app/I18N/index.js';
import { InputField } from '#V2/Components/Forms/index.js';
import { getFieldErrorState, translationMessageSlot } from '../functions/fieldErrorState.js';
import { EntityPdfFillField, type PdfFillTarget } from './EntityPdfFillField.js';
import { EntityTranslationField } from './EntityTranslationField.js';

type TextFieldProps<TFormValues extends FieldValues = FieldValues> = {
  context: string;
  label: string;
  field: Path<TFormValues>;
  type: 'text' | 'number';
  registerOptions?: RegisterOptions<TFormValues, Path<TFormValues>>;
  disabled?: boolean;
  pdfFill?: PdfFillTarget;
  translatableName?: string;
};

const TextField = <TFormValues extends FieldValues = FieldValues>({
  context,
  label,
  field,
  registerOptions,
  disabled,
  type,
  pdfFill,
  translatableName,
}: TextFieldProps<TFormValues>) => {
  const { register, setValue, getFieldState, control } = useFormContext<TFormValues>();
  const formState = useFormState({ control, name: field, exact: true });
  const fieldState = getFieldState(field, formState);
  const { showError, message } = getFieldErrorState(fieldState);
  const registration = register(field, registerOptions);
  const translatable = type === 'text' ? translatableName : undefined;
  const onCurrentChange = useCallback(
    (value: string) => {
      setValue(field, value as PathValue<TFormValues, typeof field>, {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [field, setValue]
  );

  return (
    <EntityPdfFillField
      field={field}
      setValue={setValue}
      label={label}
      disabled={disabled}
      pdfFill={pdfFill}
    >
      {slot => (
        <>
          <InputField
            id={field}
            label={
              <>
                <Translate context={context}>{label}</Translate>
                {registerOptions?.required && '*'}
              </>
            }
            type={type}
            disabled={disabled}
            hasErrors={showError}
            errorMessage={translatable ? undefined : message}
            overlay={slot?.overlay}
            labelAccessory={slot?.labelAccessory}
            latched={slot?.latched}
            onClick={slot?.onClick}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...registration}
            onFocus={() => slot?.onFocus()}
          />
          {translatable ? (
            <EntityTranslationField
              propertyName={translatable}
              label={label}
              idPrefix={String(field)}
              onCurrentChange={onCurrentChange}
              messageSlot={translationMessageSlot(showError, message)}
              disabled={disabled}
            />
          ) : null}
        </>
      )}
    </EntityPdfFillField>
  );
};

export { TextField };
