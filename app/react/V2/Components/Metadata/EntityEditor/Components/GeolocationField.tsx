import React from 'react';
import { Controller, FieldValues, Path, RegisterOptions, useFormContext } from 'react-hook-form';
import { Geolocation } from '#V2/Components/Forms/index.js';
import {
  EntityFieldError,
  EntityFieldLabel,
  getFieldErrorState,
} from '../functions/fieldErrorState.js';
import { EntityField } from './EntityField.js';

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

          const { showError, message } = getFieldErrorState(fieldState);

          return (
            <>
              <EntityFieldLabel
                htmlFor={geolocationField.name}
                context={context}
                label={label}
                required={Boolean(registerOptions?.required)}
                showError={showError}
              />
              <Geolocation
                name={geolocationField.name}
                disabled={disabled}
                value={{ lat, lon }}
                hasErrors={showError}
                onChange={({ lat: nextLat, lon: nextLon }) => {
                  geolocationField.onChange({
                    lat: nextLat,
                    lon: nextLon,
                  });
                }}
              />
              <EntityFieldError showError={showError} message={message} />
            </>
          );
        }}
      />
    </EntityField>
  );
};

export { GeolocationField };
