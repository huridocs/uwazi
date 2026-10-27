/** @jest-environment jsdom */
/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { TestAtomStoreProvider } from '#V2/testing/index.js';
import { settingsAtom } from '#V2/atoms/index.js';
import { themeControlledModeAtom } from '#V2/atoms/effectiveThemeModeAtom.js';
import { getResolvedTemplatePillColors } from '#V2/theme/templatePillTheme.js';
import { PRESET_DEFINITIONS } from '#V2/theme/tokens.js';
import { TemplateField } from '../TemplateField.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

type FormValues = { template: string };

const missingColorDot = getResolvedTemplatePillColors(
  PRESET_DEFINITIONS.default.modes.light,
  'light'
).accentHex;

const Harness = () => {
  const form = useForm<FormValues>({ defaultValues: { template: 'person' } });

  return (
    <TestAtomStoreProvider
      initialValues={[
        [settingsAtom, { themeCustomization: true }],
        [themeControlledModeAtom, 'light'],
      ]}
    >
      <FormProvider {...form}>
        <TemplateField<FormValues>
          context="System"
          label="Template"
          field="template"
          options={[
            { value: 'person', searchLabel: 'Person', color: '#7e22ce' },
            { value: 'case', searchLabel: 'Court Case' },
          ]}
        />
      </FormProvider>
    </TestAtomStoreProvider>
  );
};

const optionDot = (name: string): HTMLElement => {
  const dot = screen.getByRole('option', { name }).querySelector('span[aria-hidden]');
  if (!(dot instanceof HTMLElement)) {
    throw new Error(`missing dot for ${name}`);
  }
  return dot;
};

describe('TemplateField', () => {
  it('shows a color dot on every option and keeps the name ink', () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole('button', { name: 'Template' }));

    const person = screen.getByRole('option', { name: 'Person' });
    const personName = within(person).getByText('Person');
    expect(optionDot('Person')).toHaveStyle({ backgroundColor: 'rgb(126, 34, 206)' });
    expect(personName).toHaveClass('text-ink');
    expect(personName).not.toHaveAttribute('style');

    expect(optionDot('Court Case')).toHaveStyle({ backgroundColor: missingColorDot });
  });
});
