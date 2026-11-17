/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { TextField } from '../TextField.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  t: (_context: string, key: string) => key,
}));

type FormValues = { note: string };

const Harness = ({
  value,
  disabled,
  type = 'text',
}: {
  value: string;
  disabled?: boolean;
  type?: 'text' | 'number';
}) => {
  const form = useForm<FormValues>({ defaultValues: { note: value } });

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
      <TextField<FormValues>
        context="Template"
        label="Note"
        field="note"
        type={type}
        disabled={disabled}
      />
      <output data-testid="form-value">{form.watch('note')}</output>
    </FormProvider>
  );
};

describe('TextField clear', () => {
  it('clears a text value to an empty string', () => {
    render(<Harness value="kept" />);

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));

    expect(screen.getByRole('textbox', { name: 'Note' })).toHaveValue('');
    expect(screen.getByTestId('form-value')).toHaveTextContent('');
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
  });

  it('clears a numeric value to an empty string', () => {
    render(<Harness value="42" type="number" />);

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));

    expect(screen.getByTestId('form-value')).toHaveTextContent('');
  });

  it('shows no clear control when the value is empty or the field is disabled', () => {
    const { unmount } = render(<Harness value="" />);

    expect(screen.getByRole('textbox', { name: 'Note' })).toHaveValue('');
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
    unmount();

    render(<Harness value="kept" disabled />);
    expect(screen.getByRole('textbox', { name: 'Note' })).toHaveValue('kept');
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
  });
});
