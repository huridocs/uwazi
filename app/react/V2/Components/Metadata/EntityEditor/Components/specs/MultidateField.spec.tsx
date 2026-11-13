/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { MultidateField } from '../MultidateField.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  t: (_context: string, key: string) => key,
}));

type FormValues = { dates: { value: number | null }[] };

const Harness = ({
  value,
  disabled,
}: {
  value: { value: number | null }[];
  disabled?: boolean;
}) => {
  const form = useForm<FormValues>({ defaultValues: { dates: value } });

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
      <MultidateField<FormValues>
        context="System"
        label="Dates"
        field="dates"
        disabled={disabled}
      />
      <output data-testid="form-value">{JSON.stringify(form.watch('dates'))}</output>
    </FormProvider>
  );
};

describe('MultidateField clear', () => {
  it('clears every date and keeps the row remove control', () => {
    render(<Harness value={[{ value: 943920000 }, { value: 944006400 }]} />);

    const clear = screen.getByRole('button', { name: 'Clear' });
    expect(clear.className).not.toContain('absolute');
    expect(
      clear.parentElement?.contains(screen.getAllByRole('button', { name: 'Remove' })[0])
    ).toBe(false);

    fireEvent.click(clear);

    expect(screen.getByTestId('form-value')).toHaveTextContent(JSON.stringify([{ value: null }]));
    expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
  });

  it('shows no clear control when every date is empty or the field is disabled', () => {
    const { unmount } = render(<Harness value={[{ value: null }]} />);

    expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
    unmount();

    render(<Harness value={[{ value: 943920000 }]} disabled />);
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
  });
});
