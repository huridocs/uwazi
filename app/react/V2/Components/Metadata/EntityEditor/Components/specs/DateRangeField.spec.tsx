/**
 * @jest-environment jsdom
 */
/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { DateRangeField } from '../DateRangeField.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

type RangeValue = { from: number | null; to: number | null };
type FormValues = { range?: RangeValue };

const Harness = ({ value, disabled }: { value?: RangeValue; disabled?: boolean }) => {
  const form = useForm<FormValues>({ defaultValues: { range: value } });

  return (
    <FormProvider {...form}>
      <DateRangeField<FormValues>
        context="System"
        label="Dates"
        field="range"
        disabled={disabled}
      />
      <output data-testid="form-value">{JSON.stringify(form.watch('range') ?? null)}</output>
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

  it('clears a date range to empty ends', () => {
    render(<Harness value={{ from: 943920000, to: 943920000 }} />);

    const clear = screen.getByRole('button', { name: 'Clear' });
    expect(clear.className).not.toContain('absolute');
    expect(clear.parentElement?.contains(screen.getByLabelText('To'))).toBe(false);

    fireEvent.click(clear);

    expect(screen.getByTestId('form-value')).toHaveTextContent(
      JSON.stringify({ from: null, to: null })
    );
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
  });

  it('shows an epoch bound in the inputs', () => {
    render(<Harness value={{ from: 0, to: null }} />);

    expect(screen.getByLabelText('From')).toHaveValue('1970-01-01');
    expect(screen.getByLabelText('To')).toHaveValue('');
  });

  it('shows no clear control when the range is empty or disabled', () => {
    const { unmount } = render(<Harness />);

    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
    unmount();

    render(<Harness value={{ from: 943920000, to: null }} disabled />);
    expect(screen.getByLabelText('From')).toHaveValue('1999-11-30');
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
  });
});
