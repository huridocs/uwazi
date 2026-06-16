import React from 'react';
import { Controller, FieldValues, Path, RegisterOptions, useFormContext } from 'react-hook-form';
import { Translate } from '#app/I18N/index.js';
import { Geolocation } from '#V2/Components/Forms/index.js';

type GeolocationFieldProps<TFormValues extends FieldValues = FieldValues> = {
  context: string;
  label: string;
  field: Path<TFormValues>;
  registerOptions?: RegisterOptions<TFormValues, Path<TFormValues>>;
  disabled?: boolean;
};

const GeolocationField = <TFormValues extends FieldValues = FieldValues>({
  context,
  label,
  field,
  registerOptions,
  disabled,
}: GeolocationFieldProps<TFormValues>) => {
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

            if (!value) {
              return 'Required';
            }

            const { lat, lon } = value as {
              lat?: number;
              lon?: number;
            };

            return typeof lat === 'number' && typeof lon === 'number' ? true : 'Required';
          },
        }}
        render={({ field: geolocationField, fieldState }) => {
          const { lat, lon } =
            geolocationField.value && typeof geolocationField.value === 'object'
              ? (geolocationField.value as {
                  lat?: number;
                  lon?: number;
                })
              : {};

          const showRequiredError = Boolean(fieldState.error);

          return (
            <>
              <div className="font-bold mb-2">
                <Translate className="" context={context}>
                  {label}
                </Translate>
                {registerOptions?.required && '*'}
              </div>
              <Geolocation
                name={geolocationField.name}
                disabled={disabled}
                value={{ lat, lon }}
                onChange={({ lat: nextLat, lon: nextLon }) => {
                  geolocationField.onChange({
                    lat: nextLat,
                    lon: nextLon,
                  });
                }}
              />
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

export { GeolocationField };
