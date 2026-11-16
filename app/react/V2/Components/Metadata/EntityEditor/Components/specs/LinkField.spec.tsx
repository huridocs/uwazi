/**
 * @jest-environment jsdom
 */
/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import { FormProvider, useForm } from 'react-hook-form';
import { localeAtom, settingsAtom } from '#V2/atoms/index.js';
import { EMPTY_ICON } from '../IconField.js';
import { LinkField } from '../LinkField.js';
import type { EditEntityFormValues } from '../../functions/buildEditEntityDefaultValues.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  t: (_context: string, key: string) => key,
}));

class ResizeObserverMock {
  callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe() {
    this.callback([], this);
  }

  unobserve() {
    this.callback([], this);
  }

  disconnect() {
    this.callback([], this);
  }
}

global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

const Harness = ({
  link = { label: 'Docs', url: 'https://en.example' },
  disabled,
  translations = {},
}: {
  link?: { label: string; url: string };
  disabled?: boolean;
  translations?: EditEntityFormValues['translations'];
}) => {
  const form = useForm<EditEntityFormValues>({
    defaultValues: {
      title: 'Hearing',
      template: 't1',
      showIcon: false,
      icon: EMPTY_ICON,
      metadata: { link: [{ value: link }] },
      translations,
      touchedTranslations: {},
    },
  });
  const store = createStore();
  store.set(settingsAtom, {
    languages: [
      { key: 'en', label: 'English', default: true },
      { key: 'es', label: 'Spanish' },
    ],
  });
  store.set(localeAtom, 'en');

  return (
    <Provider store={store}>
      <FormProvider {...form}>
        <LinkField<EditEntityFormValues>
          context="System"
          label="Link"
          field="metadata.link.0.value"
          translatableName="link"
          disabled={disabled}
        />
        <pre data-testid="values">{JSON.stringify(form.watch('translations'))}</pre>
        <pre data-testid="touched">{JSON.stringify(form.watch('touchedTranslations'))}</pre>
        <output data-testid="form-value">
          {JSON.stringify(form.watch('metadata.link.0.value'))}
        </output>
      </FormProvider>
    </Provider>
  );
};

describe('LinkField', () => {
  it('keeps label and url translations in one languages section', () => {
    render(<Harness />);

    const languages = screen.getAllByRole('button', { name: /Languages:/ });
    expect(languages).toHaveLength(1);

    fireEvent.click(languages[0]);

    expect(screen.getByRole('textbox', { name: 'Español link' })).toBeInTheDocument();
    const url = screen.getByRole('textbox', { name: 'Español link url' });
    fireEvent.change(url, { target: { value: 'https://es.example' } });
    fireEvent.blur(url);

    expect(JSON.parse(screen.getByTestId('values').textContent ?? '{}')).toEqual({
      es: { link: [{ value: { label: 'Docs', url: 'https://es.example' } }] },
    });
  });

  it('clears the link label and url together', () => {
    render(<Harness />);

    const clear = screen.getByRole('button', { name: 'Clear' });
    const labelInput = screen.getByRole('textbox', { name: 'Label' });
    expect(clear.className).not.toContain('absolute');
    expect(clear.parentElement?.contains(labelInput)).toBe(false);

    fireEvent.click(clear);

    expect(screen.getByTestId('form-value')).toHaveTextContent(
      JSON.stringify({ label: '', url: '' })
    );
  });

  it('clears translated link values with the field', () => {
    render(
      <Harness
        translations={{
          es: { link: [{ value: { label: 'Docs', url: 'https://es.example' } }] },
        }}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));

    expect(JSON.parse(screen.getByTestId('values').textContent ?? '{}')).toEqual({
      es: { link: [{ value: { label: '', url: '' } }] },
    });
    expect(JSON.parse(screen.getByTestId('touched').textContent ?? '{}')).toEqual({
      es: { link: true },
    });
  });

  it('shows no clear control when the link is empty or disabled', () => {
    const { unmount } = render(<Harness link={{ label: '', url: '' }} />);

    expect(screen.getByLabelText('URL')).toHaveValue('');
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
    unmount();

    render(<Harness disabled />);
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
  });
});
