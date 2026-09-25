/**
 * @jest-environment jsdom
 */
/* eslint-disable react/no-multi-comp -- form provider + hook probe */
import React from 'react';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';
import { fireEvent, render, screen } from '@testing-library/react';
import { EMPTY_ICON } from '../IconField.js';
import type { EditEntityFormValues } from '../../functions/buildEditEntityDefaultValues.js';
import { useTranslationFieldHandlers } from '../useTranslationFieldHandlers.js';

const defaultValues = (): EditEntityFormValues => ({
  title: 'Hearing',
  template: 't1',
  showIcon: false,
  icon: EMPTY_ICON,
  metadata: { description: [{ value: 'Summary' }] },
  translations: {
    es: {
      title: [{ value: 'Audiencia' }],
      description: [{ value: 'Resumen' }],
    },
  },
  touchedTranslations: {},
});

const Buttons = () => {
  const form = useFormContext<EditEntityFormValues>();
  const { onChange } = useTranslationFieldHandlers({
    propertyName: 'title',
    current: 'en',
    currentValue: 'Hearing',
    sourceField: 'title',
    onCurrentChange: jest.fn(),
    languages: ['en', 'es'],
  });
  return (
    <>
      <button type="button" onClick={() => onChange('es', 'Hola')}>
        first
      </button>
      <button type="button" onClick={() => onChange('es', 'Hola!')}>
        second
      </button>
      <pre data-testid="values">{JSON.stringify(form.getValues())}</pre>
    </>
  );
};

const Harness = () => {
  const form = useForm<EditEntityFormValues>({ defaultValues: defaultValues() });
  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <FormProvider {...form}>
      <Buttons />
    </FormProvider>
  );
};

describe('useTranslationFieldHandlers', () => {
  it('writes only the edited translation path and touches it once', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'first' }));
    fireEvent.click(screen.getByRole('button', { name: 'second' }));
    const values = JSON.parse(screen.getByTestId('values').textContent ?? '{}');
    expect(values.translations.es).toEqual({
      title: [{ value: 'Hola!' }],
      description: [{ value: 'Resumen' }],
    });
    expect(values.touchedTranslations).toEqual({ es: { title: true } });
  });
});
