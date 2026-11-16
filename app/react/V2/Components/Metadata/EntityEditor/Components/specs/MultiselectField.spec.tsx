/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import type { MetadataValue } from '#V2/formatters/types.js';
import { MultiselectField } from '../MultiselectField.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  t: (_context: string, key: string) => key,
}));

type FormValues = { tags: MetadataValue[] };

const options = [
  { value: 'a', label: 'Alpha', searchLabel: 'alpha' },
  { value: 'b', label: 'Beta', searchLabel: 'beta' },
];

const Harness = ({ value, disabled }: { value: MetadataValue[]; disabled?: boolean }) => {
  const form = useForm<FormValues>({ defaultValues: { tags: value } });

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
      <MultiselectField<FormValues>
        context="System"
        label="Tags"
        field="tags"
        options={options}
        disabled={disabled}
      />
      <output data-testid="form-value">{JSON.stringify(form.watch('tags'))}</output>
    </FormProvider>
  );
};

describe('MultiselectField clear', () => {
  it('clears the selected values', () => {
    render(<Harness value={[{ value: 'a', label: 'Alpha' }]} />);

    const clear = screen.getByRole('button', { name: 'Clear' });
    expect(clear.className).not.toContain('absolute');
    expect(clear.parentElement?.contains(screen.getByText('Alpha'))).toBe(false);

    fireEvent.click(clear);

    expect(screen.getByTestId('form-value')).toHaveTextContent('[]');
    expect(screen.getByText('Alpha')).toBeInTheDocument();
  });

  it('shows no clear control when nothing is selected or the field is disabled', () => {
    const { unmount } = render(<Harness value={[]} />);

    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
    unmount();

    render(<Harness value={[{ value: 'a', label: 'Alpha' }]} disabled />);
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
  });
});
