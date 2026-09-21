import React from 'react';
import { FieldValues, Path, RegisterOptions, useFormContext, useWatch } from 'react-hook-form';
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
  const { register, setValue, getFieldState, formState } = useFormContext<TFormValues>();
  const fieldState = getFieldState(field, formState);
  const { showError, message } = getFieldErrorState(fieldState);
  const registration = register(field, registerOptions);
  const currentValue = String(useWatch({ name: field }) ?? '');
  const translatable = type === 'text' ? translatableName : undefined;

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
              currentValue={currentValue}
              onCurrentChange={value =>
                setValue(field, value as TFormValues[typeof field], {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
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
