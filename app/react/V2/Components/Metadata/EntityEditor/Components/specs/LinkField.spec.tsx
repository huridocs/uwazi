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

const Harness = () => {
  const form = useForm<EditEntityFormValues>({
    defaultValues: {
      title: 'Hearing',
      template: 't1',
      showIcon: false,
      icon: EMPTY_ICON,
      metadata: { link: [{ value: { label: 'Docs', url: 'https://en.example' } }] },
      translations: {},
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
        />
        <pre data-testid="values">{JSON.stringify(form.watch('translations'))}</pre>
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
});
