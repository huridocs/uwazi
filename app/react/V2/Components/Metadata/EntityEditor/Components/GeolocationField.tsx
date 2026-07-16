import React from 'react';
import { Controller, FieldValues, Path, RegisterOptions, useFormContext } from 'react-hook-form';
import { Geolocation } from '#V2/Components/Forms/index.js';
import {
  isFiniteNumber,
  validateGeolocationValue,
} from '#V2/Components/Forms/geolocationCoordinates.js';
import type { MetadataValue } from '#V2/formatters/types.js';
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

type GeolocationValue = {
  lat?: number;
  lon?: number;
  label?: string;
};

const coordsFromValue = (value: unknown): GeolocationValue => {
  if (!value || typeof value !== 'object') {
    return {};
  }
  const record = value as GeolocationValue & { latitude?: number; longitude?: number };
  return {
    lat: record.lat ?? record.latitude,
    lon: record.lon ?? record.longitude,
    label: typeof record.label === 'string' ? record.label : undefined,
  };
};

const coordsFromEntries = (entries: MetadataValue[] | undefined): GeolocationValue =>
  coordsFromValue(entries?.[0]?.value);

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
            const coords = coordsFromEntries(value as MetadataValue[] | undefined);
            return validateGeolocationValue(coords, required);
          },
        }}
        render={({ field: geolocationField, fieldState }) => {
          const entries = (geolocationField.value as MetadataValue[] | undefined) ?? [];
          const { lat, lon, label: pointLabel } = coordsFromEntries(entries);
          const { showError, message } = getFieldErrorState(fieldState);

          return (
            <>
              <EntityFieldLabel
                htmlFor={geolocationField.name}
                context={context}
                label={label}
                required={required}
                showError={showError}
              />
              <Geolocation
                name={geolocationField.name}
                disabled={disabled}
                value={{ lat, lon }}
                hasErrors={showError}
                onChange={({ lat: nextLat, lon: nextLon }) => {
                  if (!isFiniteNumber(nextLat) && !isFiniteNumber(nextLon)) {
                    geolocationField.onChange([]);
                    return;
                  }
                  const rest = entries.slice(1);
                  geolocationField.onChange([
                    {
                      value: {
                        lat: nextLat,
                        lon: nextLon,
                        label: pointLabel ?? '',
                      },
                    },
                    ...rest,
                  ]);
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
