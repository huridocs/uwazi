/**
 * @jest-environment jsdom
 */
/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { DateRangeField } from '../DateRangeField.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => children,
}));

type FormValues = { range?: { from?: number; to?: number } };

const Harness = () => {
  const form = useForm<FormValues>({ defaultValues: { range: undefined } });

  return (
    <FormProvider {...form}>
      <DateRangeField<FormValues> context="System" label="Dates" field="range" />
    </FormProvider>
  );
};

describe('DateRangeField', () => {
  it('uses secondary labels stacked like geolocation coordinates', () => {
    render(<Harness />);

    expect(screen.getByLabelText('From')).toHaveAttribute('type', 'date');
    expect(screen.getByLabelText('To')).toHaveAttribute('type', 'date');
    expect(screen.getByText('From')).toHaveClass('text-xs', 'text-ink-tertiary');
    expect(screen.getByText('To')).toHaveClass('text-xs', 'text-ink-tertiary');
  });
});
