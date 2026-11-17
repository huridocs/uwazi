/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { DateField } from '../DateField.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  t: (_context: string, key: string) => key,
}));

type FormValues = { when: number | null };

const Harness = ({ value, disabled }: { value: number | null; disabled?: boolean }) => {
  const form = useForm<FormValues>({ defaultValues: { when: value } });

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
      <DateField<FormValues> context="Template" label="When" field="when" disabled={disabled} />
      <output data-testid="form-value">{String(form.watch('when'))}</output>
    </FormProvider>
  );
};

describe('DateField clear', () => {
  it('clears a date to null', () => {
    render(<Harness value={943920000} />);

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));

    expect(screen.getByLabelText('When')).toHaveValue('');
    expect(screen.getByTestId('form-value')).toHaveTextContent('null');
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
  });

  it('clears a number that does not format as a date', () => {
    render(<Harness value={Number.NaN} />);

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));

    expect(screen.getByTestId('form-value')).toHaveTextContent('null');
  });

  it('shows no clear control when the date is empty or disabled', () => {
    const { unmount } = render(<Harness value={null} />);

    expect(screen.getByLabelText('When')).toHaveValue('');
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
    unmount();

    render(<Harness value={943920000} disabled />);
    expect(screen.getByLabelText('When')).toHaveValue('1999-11-30');
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
  });
});
