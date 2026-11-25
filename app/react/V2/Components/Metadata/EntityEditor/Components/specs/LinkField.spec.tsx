/**
 * @jest-environment jsdom
 */
/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
  omitValue,
  required,
  disabled,
  translations = {},
  serverError,
}: {
  link?: { label: string; url: string };
  omitValue?: boolean;
  required?: boolean;
  disabled?: boolean;
  translations?: EditEntityFormValues['translations'];
  serverError?: string;
}) => {
  const form = useForm<EditEntityFormValues>({
    mode: 'onTouched',
    defaultValues: {
      title: 'Hearing',
      template: 't1',
      showIcon: false,
      icon: EMPTY_ICON,
      metadata: { link: omitValue ? [] : [{ value: link }] },
      translations,
      touchedTranslations: {},
    },
  });
  useEffect(() => {
    if (!serverError) return;
    form.setError('metadata.link.0.value', { type: 'server', message: serverError });
  }, [form, serverError]);
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
          registerOptions={required ? { required: true } : undefined}
          disabled={disabled}
        />
        <pre data-testid="values">{JSON.stringify(form.watch('translations'))}</pre>
        <pre data-testid="touched">{JSON.stringify(form.watch('touchedTranslations'))}</pre>
        <output data-testid="form-value">
          {JSON.stringify(form.watch('metadata.link.0.value'))}
        </output>
        <output data-testid="link-error">{JSON.stringify(form.formState.errors)}</output>
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

  it('shows Invalid URL on the link field when the url is not valid', async () => {
    render(<Harness link={{ label: 'Docs', url: 'not-a-url' }} />);

    const url = screen.getByLabelText('URL');
    expect(url).toHaveAttribute('type', 'text');
    fireEvent.blur(url);

    expect(await screen.findByText('Invalid URL')).toBeInTheDocument();
  });

  it('rejects htp URLs that pass browser url input but fail isValidUrl', async () => {
    render(<Harness link={{ label: 'Docs', url: 'htp:/a.url.com' }} />);

    fireEvent.blur(screen.getByLabelText('URL'));

    expect(await screen.findByText('Invalid URL')).toBeInTheDocument();
  });

  it('keeps a string url when a required link label is typed', async () => {
    render(<Harness omitValue required />);
    fireEvent.change(screen.getByLabelText('Label'), { target: { value: 'Site' } });
    fireEvent.blur(screen.getByLabelText('URL'));
    await waitFor(() =>
      expect(screen.getByTestId('form-value').textContent).toBe('{"label":"Site","url":""}')
    );
  });

  it('stores a trimmed url so a padded valid url is what gets saved', () => {
    render(<Harness link={{ label: 'Docs', url: ' https://example.com ' }} />);

    fireEvent.blur(screen.getByLabelText('URL'));

    expect(screen.getByTestId('form-value')).toHaveTextContent(
      JSON.stringify({ label: 'Docs', url: 'https://example.com' })
    );
    expect(screen.queryByText('Invalid URL')).not.toBeInTheDocument();
  });

  describe('error placement', () => {
    it('shows an invalid translation url on the languages row', () => {
      render(
        <Harness
          link={{ label: 'Docs', url: 'https://example.com' }}
          translations={{
            es: { link: [{ value: { label: 'Docs', url: 'not-a-url' } }] },
          }}
        />
      );

      expect(screen.getByText('Invalid URL')).toBeInTheDocument();
      expect(screen.getByLabelText('URL').className).not.toContain('border-emphasis');
    });

    it('clears the link error after the translation url is fixed', async () => {
      render(
        <Harness
          link={{ label: 'Docs', url: 'https://example.com' }}
          translations={{
            es: { link: [{ value: { label: 'Docs', url: 'not-a-url' } }] },
          }}
        />
      );

      fireEvent.blur(screen.getByLabelText('URL'));
      await waitFor(() =>
        expect(screen.getByTestId('link-error')).toHaveTextContent('Invalid URL')
      );

      fireEvent.click(screen.getByRole('button', { name: /Languages:/ }));
      const translated = screen.getByRole('textbox', { name: 'Español link url' });
      fireEvent.change(translated, { target: { value: 'https://es.example' } });
      fireEvent.blur(translated);

      await waitFor(() => expect(screen.getByTestId('link-error')).toHaveTextContent('{}'));
      expect(screen.queryByText('Invalid URL')).not.toBeInTheDocument();
    });

    it('flags a whitespace-only translation url', () => {
      render(
        <Harness
          link={{ label: 'Docs', url: 'https://example.com' }}
          translations={{
            es: { link: [{ value: { label: 'Docs', url: '   ' } }] },
          }}
        />
      );

      expect(screen.getByText('Invalid URL')).toBeInTheDocument();
    });

    it('rejects a short url the media picker would reject', async () => {
      render(<Harness link={{ label: 'Docs', url: 'http://x' }} />);

      fireEvent.blur(screen.getByLabelText('URL'));

      expect(await screen.findByText('Invalid URL')).toBeInTheDocument();
    });

    it('shows a server error on the main url when the url itself is valid', async () => {
      render(
        <Harness
          link={{ label: 'Docs', url: 'https://example.com' }}
          serverError="This field is required"
        />
      );

      expect(await screen.findByText('This field is required')).toBeInTheDocument();
      expect(screen.getByLabelText('URL').className).toContain('border-emphasis');
    });

    it('keeps a translation-only server url error off the main url', async () => {
      render(
        <Harness
          link={{ label: 'Docs', url: 'https://example.com' }}
          translations={{
            es: { link: [{ value: { label: 'Docs', url: 'not-a-url' } }] },
          }}
          serverError="Invalid URL"
        />
      );

      expect(await screen.findByText('Invalid URL')).toBeInTheDocument();
      expect(screen.getByLabelText('URL').className).not.toContain('border-emphasis');
    });

    it('accepts an empty url when the link field is optional', () => {
      render(<Harness link={{ label: '', url: '' }} />);

      fireEvent.blur(screen.getByLabelText('URL'));

      expect(screen.queryByText('Invalid URL')).not.toBeInTheDocument();
    });
  });
});
