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
import { Textarea } from '#V2/Components/Forms/index.js';
import { getFieldErrorState, translationMessageSlot } from '../functions/fieldErrorState.js';
import { EntityPdfFillField } from './EntityPdfFillField.js';
import { EntityTranslationField } from './EntityTranslationField.js';

type TitleFieldProps<TFormValues extends FieldValues = FieldValues> = {
  context: string;
  label: string;
  field: Path<TFormValues>;
  registerOptions?: RegisterOptions<TFormValues, Path<TFormValues>>;
  disabled?: boolean;
};

const TitleField = <TFormValues extends FieldValues = FieldValues>({
  context,
  label,
  field,
  registerOptions,
  disabled,
}: TitleFieldProps<TFormValues>) => {
  const { register, setValue, getFieldState, control } = useFormContext<TFormValues>();
  const formState = useFormState({ control, name: field, exact: true });
  const { showError, message } = getFieldErrorState(getFieldState(field, formState));
  const registration = register(field, registerOptions);
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
      pdfFill={{ name: 'title', coerceType: 'text' }}
    >
      {slot => (
        <>
          <Textarea
            id={field}
            label={
              <>
                <Translate context={context}>{label}</Translate>
                {registerOptions?.required && '*'}
              </>
            }
            disabled={disabled}
            hasErrors={showError}
            rows={2}
            resize="none"
            overlay={slot?.overlay}
            labelAccessory={slot?.labelAccessory}
            latched={slot?.latched}
            onClick={slot?.onClick}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...registration}
            onFocus={() => slot?.onFocus()}
          />
          <EntityTranslationField
            propertyName="title"
            label={label}
            idPrefix={String(field)}
            onCurrentChange={onCurrentChange}
            messageSlot={translationMessageSlot(showError, message)}
            disabled={disabled}
          />
        </>
      )}
    </EntityPdfFillField>
  );
};

export { TitleField };
