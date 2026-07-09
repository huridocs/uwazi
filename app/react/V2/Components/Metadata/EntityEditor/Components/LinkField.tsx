import React from 'react';
import { Controller, FieldValues, Path, RegisterOptions, useFormContext } from 'react-hook-form';
import { Translate } from '#app/I18N/index.js';

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
    <div className="text-ink bg-(--bg-surface)">
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
          const { label: urlLabel, url } = (fieldValue.value as {
            url: string;
            label?: string;
          }) || {
            label: '',
            url: '',
          };

          const showRequiredError = Boolean(fieldState.error);
          const valueInputClassName = `block w-full rounded-lg border p-2.5 text-sm ${
            showRequiredError
              ? 'border-(--color-theme-control-border-error) bg-(--color-theme-control-bg-error) text-(--color-theme-control-text-error) focus:border-(--color-theme-control-border-error) focus:[box-shadow:0_0_0_4px_var(--color-theme-control-error-ring)]'
              : 'border-(--color-theme-control-border) bg-(--color-theme-control-bg)'
          }`;

          return (
            <>
              <div
                className={`font-bold mb-2 ${
                  showRequiredError ? 'text-(--color-theme-control-text-error)' : ''
                }`}
              >
                <Translate className="" context={context}>
                  {label}
                </Translate>
                {registerOptions?.required && '*'}
              </div>
              <div className="flex flex-col md:flex-row gap-2">
                <div className="flex flex-row items-center gap-1 md:w-1/3">
                  <label htmlFor={`${field}.label`} className="font-medium text-sm">
                    <Translate>Label</Translate>:
                  </label>
                  <input
                    id={`${field}.label`}
                    type="text"
                    disabled={disabled}
                    name={`${fieldValue.name}.label`}
                    value={urlLabel}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      fieldValue.onChange({ ...fieldValue.value, label: e.target.value })
                    }
                    onBlur={fieldValue.onBlur}
                    className={valueInputClassName}
                  />
                </div>
                <div className="flex flex-row items-center gap-1 md:w-2/3">
                  <label htmlFor={`${field}.url`} className="font-medium text-sm">
                    <Translate>URL</Translate>:
                  </label>
                  <input
                    id={`${field}.url`}
                    type="url"
                    disabled={disabled}
                    name={`${fieldValue.name}.url`}
                    ref={fieldValue.ref}
                    value={url}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      fieldValue.onChange({ ...fieldValue.value, url: e.target.value })
                    }
                    onBlur={fieldValue.onBlur}
                    className={valueInputClassName}
                  />
                </div>
              </div>
              {showRequiredError ? (
                <div className="mt-2 text-sm text-(--color-theme-control-text-error)">
                  <Translate>This field is required</Translate>
                </div>
              ) : null}
            </>
          );
        }}
      />
    </div>
  );
};

export { LinkField };
