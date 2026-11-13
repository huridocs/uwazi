/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import type { MetadataValue } from '#V2/formatters/types.js';
import { NestedField } from '../NestedField.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  t: (_context: string, key: string) => key,
}));

type FormValues = { rows: MetadataValue[] };

const filled: MetadataValue[] = [{ value: { prop1: ['1'], prop2: [] } }];

const Harness = ({ value, disabled }: { value: MetadataValue[]; disabled?: boolean }) => {
  const form = useForm<FormValues>({ defaultValues: { rows: value } });

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
      <NestedField<FormValues> context="Template" label="Rows" field="rows" disabled={disabled} />
      <output data-testid="form-value">{JSON.stringify(form.watch('rows'))}</output>
    </FormProvider>
  );
};

describe('NestedField clear', () => {
  it('clears a nested value to an empty list', () => {
    render(<Harness value={filled} />);

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));

    expect(screen.getByTestId('form-value')).toHaveTextContent('[]');
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
  });

  it('shows no clear control when the nested value is empty or disabled', () => {
    const { unmount } = render(<Harness value={[]} />);

    expect(screen.getByRole('textbox', { name: 'Rows' })).toHaveValue('');
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
    unmount();

    render(<Harness value={filled} disabled />);
    expect(screen.getByRole('textbox', { name: 'Rows' })).not.toHaveValue('');
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
  });
});
