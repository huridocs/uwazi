/**
 * @jest-environment jsdom
 */
/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { TemplateField } from '../TemplateField.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => children,
}));

type FormValues = { template: string };

const Harness = () => {
  const form = useForm<FormValues>({ defaultValues: { template: 'person' } });

  return (
    <FormProvider {...form}>
      <TemplateField<FormValues>
        context="System"
        label="Template"
        field="template"
        options={[
          { value: 'person', searchLabel: 'Person', color: '#7e22ce' },
          { value: 'case', searchLabel: 'Court Case', color: '#0e9f6e' },
        ]}
      />
    </FormProvider>
  );
};

describe('TemplateField', () => {
  it('shows the selected template color on the closed value and options', () => {
    render(<Harness />);

    expect(screen.getByText('Person')).toHaveStyle({ color: 'rgb(126, 34, 206)' });
    expect(screen.getByText('Person')).toHaveClass('normal-case');

    fireEvent.click(screen.getByRole('button', { name: 'Template' }));

    expect(screen.getByRole('option', { name: 'Court Case' })).toHaveTextContent('Court Case');
    expect(screen.getByText('Court Case')).toHaveStyle({ color: 'rgb(14, 159, 110)' });
  });
});
