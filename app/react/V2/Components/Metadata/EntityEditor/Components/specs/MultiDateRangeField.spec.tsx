/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { MultiDateRangeField } from '../MultiDateRangeField.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  t: (_context: string, key: string) => key,
}));

type RangeRow = { value: { from: number | null; to: number | null } };
type FormValues = { ranges: RangeRow[] };

const filled: RangeRow = { value: { from: 943920000, to: 944006400 } };

const Harness = ({ value, disabled }: { value: RangeRow[]; disabled?: boolean }) => {
  const form = useForm<FormValues>({ defaultValues: { ranges: value } });

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
      <MultiDateRangeField<FormValues>
        context="System"
        label="Ranges"
        field="ranges"
        disabled={disabled}
      />
      <output data-testid="form-value">{JSON.stringify(form.watch('ranges'))}</output>
    </FormProvider>
  );
};

describe('MultiDateRangeField clear', () => {
  it('clears every range and keeps the row remove control', () => {
    render(<Harness value={[filled, { value: { from: 944092800, to: 944179200 } }]} />);

    const clear = screen.getByRole('button', { name: 'Clear' });
    expect(clear.className).not.toContain('absolute');
    expect(clear.parentElement?.contains(screen.getAllByLabelText('To')[0])).toBe(false);

    fireEvent.click(clear);

    expect(screen.getByTestId('form-value')).toHaveTextContent(
      JSON.stringify([{ value: { from: null, to: null } }])
    );
    expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
  });

  it('shows no clear control when every range is empty or the field is disabled', () => {
    const { unmount } = render(<Harness value={[{ value: { from: null, to: null } }]} />);

    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
    unmount();

    render(<Harness value={[filled]} disabled />);
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
  });
});
