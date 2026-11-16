/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { TitleField } from '../TitleField.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  t: (_context: string, key: string) => key,
}));

jest.mock('../EntityPdfFillField', () => {
  const actual =
    jest.requireActual<typeof import('../EntityPdfFillField.js')>('../EntityPdfFillField');
  return {
    ...actual,
    EntityPdfFillField: ({ children }: { children: (slot?: undefined) => React.ReactNode }) => (
      <>{children()}</>
    ),
  };
});

jest.mock('../EntityTranslationField', () => ({
  EntityTranslationField: () => null,
}));

type FormValues = { title: string };

const Harness = ({ value, disabled }: { value: string; disabled?: boolean }) => {
  const form = useForm<FormValues>({ defaultValues: { title: value } });

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
      <TitleField<FormValues> context="System" label="Title" field="title" disabled={disabled} />
      <output data-testid="form-value">{form.watch('title')}</output>
    </FormProvider>
  );
};

describe('TitleField clear', () => {
  it('clears a title to an empty string', () => {
    render(<Harness value="Hearing" />);

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));

    expect(screen.getByRole('textbox', { name: 'Title' })).toHaveValue('');
    expect(screen.getByTestId('form-value')).toHaveTextContent('');
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
  });

  it('shows no clear control when the title is empty or the field is disabled', () => {
    const { unmount } = render(<Harness value="" />);

    expect(screen.getByRole('textbox', { name: 'Title' })).toHaveValue('');
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
    unmount();

    render(<Harness value="Hearing" disabled />);
    expect(screen.getByRole('textbox', { name: 'Title' })).toHaveValue('Hearing');
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
  });
});
