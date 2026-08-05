import React from 'react';
import { Controller, FieldValues, Path, RegisterOptions, useFormContext } from 'react-hook-form';
import { Translate } from '#app/I18N/index.js';
import { InputField } from '#V2/Components/Forms/index.js';
import { Label } from '#V2/Components/Forms/Label.js';
import { EntityFieldError, getFieldErrorState } from '../functions/fieldErrorState.js';
import { EntityField } from './EntityField.js';

type LinkFieldProps<TFormValues extends FieldValues = FieldValues> = {
  context: string;
  label: string;
  field: Path<TFormValues>;
  registerOptions?: RegisterOptions<TFormValues, Path<TFormValues>>;
  disabled?: boolean;
};

const LinkField = <TFormValues extends FieldValues = FieldValues>({
  context,
  label,
  field,
  registerOptions,
  disabled,
}: LinkFieldProps<TFormValues>) => {
  const { control } = useFormContext<TFormValues>();
  const required = Boolean(registerOptions?.required);

  return (
    <EntityField>
      <Controller
        control={control}
        name={field}
        rules={{
          ...registerOptions,
          validate: value => {
            if (!required) {
              return true;
            }
            const url = value.url ? value.url.trim() : '';
            return url.length > 0 || 'Required';
          },
        }}
        render={({ field: fieldValue, fieldState }) => {
          const { label: linkLabel, url } = (fieldValue.value as {
            url: string;
            label?: string;
          }) || {
            label: '',
            url: '',
          };

          const { showError, message } = getFieldErrorState(fieldState);

          return (
            <>
              <Label htmlFor={`${field}.url`} hasErrors={showError}>
                <Translate context={context}>{label}</Translate>
                {registerOptions?.required && '*'}
              </Label>
              <div className="flex flex-col gap-2 md:flex-row">
                <div className="md:w-1/3">
                  <InputField
                    id={`${field}.label`}
                    label={<Translate>Label</Translate>}
                    type="text"
                    disabled={disabled}
                    name={`${fieldValue.name}.label`}
                    value={linkLabel}
                    hasErrors={showError}
                    onBlur={fieldValue.onBlur}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      fieldValue.onChange({ ...fieldValue.value, label: event.target.value })
                    }
                  />
                </div>
                <div className="md:w-2/3">
                  <InputField
                    id={`${field}.url`}
                    label={<Translate>URL</Translate>}
                    type="url"
                    disabled={disabled}
                    name={`${fieldValue.name}.url`}
                    ref={fieldValue.ref}
                    value={url}
                    placeholder="https://"
                    hasErrors={showError}
                    onBlur={fieldValue.onBlur}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      fieldValue.onChange({ ...fieldValue.value, url: event.target.value })
                    }
                  />
                </div>
              </div>
              <EntityFieldError showError={showError} message={message} />
            </>
          );
        }}
      />
    </EntityField>
  );
};

export { LinkField };
