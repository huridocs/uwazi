/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import type { MetadataValue } from '#V2/formatters/types.js';
import { GeolocationField } from '../GeolocationField.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  t: (_context: string, key: string) => key,
}));

jest.mock('#app/Map/MapContainer.js', () => ({
  Map: () => <div data-testid="map" />,
}));

type FormValues = { point: MetadataValue[] };

const point: MetadataValue[] = [{ value: { lat: 1, lon: 2, label: '' } }];

const Harness = ({ value, disabled }: { value: MetadataValue[]; disabled?: boolean }) => {
  const form = useForm<FormValues>({ defaultValues: { point: value } });

  return (
    <FormProvider
      watch={form.watch}
      getValues={form.getValues}
      getErrors={form.getErrors}
      getFieldState={form.getFieldState}
      setError={form.setError}
      clearErrors={form.clearErrors}
      setValue={form.setValue}
      setValues={form.setValues}
      trigger={form.trigger}
      formState={form.formState}
      resetField={form.resetField}
      reset={form.reset}
      resetDefaultValues={form.resetDefaultValues}
      handleSubmit={form.handleSubmit}
      unregister={form.unregister}
      control={form.control}
      register={form.register}
      setFocus={form.setFocus}
      subscribe={form.subscribe}
    >
      <GeolocationField<FormValues>
        context="System"
        label="Place"
        field="point"
        disabled={disabled}
      />
      <output data-testid="form-value">{JSON.stringify(form.watch('point'))}</output>
    </FormProvider>
  );
};

describe('GeolocationField clear', () => {
  it('clears the point', () => {
    render(<Harness value={point} />);

    const clear = screen.getByRole('button', { name: 'Clear' });
    expect(clear.className).not.toContain('absolute');
    expect(screen.getByTestId('map').parentElement?.contains(clear)).toBe(false);

    fireEvent.click(clear);

    expect(screen.getByTestId('form-value')).toHaveTextContent('[]');
    expect(screen.getByTestId('map')).toBeInTheDocument();
  });

  it('shows no clear control when the point is empty or the field is disabled', () => {
    const { unmount } = render(<Harness value={[]} />);

    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
    unmount();

    render(<Harness value={point} disabled />);
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
  });
});
