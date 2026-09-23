/**
 * @jest-environment jsdom
 */
import React, { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MultiLanguageField } from '../MultiLanguageField.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => children,
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
  onTranslate,
  initial = { en: 'Hearing', es: 'Audiencia', fr: '' },
  changeSource = false,
}: {
  onTranslate?: (language: string) => Promise<string>;
  initial?: Record<string, string>;
  changeSource?: boolean;
}) => {
  const [values, setValues] = useState(initial);
  return (
    <>
      {changeSource ? (
        <button type="button" onClick={() => setValues(prev => ({ ...prev, en: 'Changed' }))}>
          change source
        </button>
      ) : null}
      <MultiLanguageField
        label="Title"
        idPrefix="title"
        languages={['en', 'es', 'fr']}
        current="en"
        values={values}
        onChange={(language, value) => setValues(prev => ({ ...prev, [language]: value }))}
        onTranslate={onTranslate}
      />
    </>
  );
};

describe('MultiLanguageField', () => {
  it('summarizes empty languages and fills only empties on auto-translate', async () => {
    const onTranslate = jest.fn(async (language: string) => `translated-${language}`);
    render(<Harness onTranslate={onTranslate} />);

    expect(screen.getByRole('button', { name: /Languages:/ })).toHaveAccessibleName(
      'Languages: 1 of 2 other languages empty'
    );

    fireEvent.click(screen.getByRole('button', { name: 'Auto-translate' }));

    await waitFor(() => {
      expect(screen.getByLabelText('Français title')).toHaveValue('translated-fr');
    });
    expect(onTranslate).toHaveBeenCalledTimes(1);
    expect(onTranslate).toHaveBeenCalledWith('fr');
    expect(screen.getByLabelText('Español title')).toHaveValue('Audiencia');
    expect(screen.getByText('Auto')).toBeInTheDocument();
  });

  it('hides auto-translate when the service is not provided', () => {
    render(<Harness />);
    expect(screen.queryByRole('button', { name: 'Auto-translate' })).not.toBeInTheDocument();
  });

  it('does not reserve a status column when auto-translate is off', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: /Languages:/ }));
    expect(screen.queryByRole('button', { name: /Re-translate/ })).not.toBeInTheDocument();
    expect(screen.queryByText('Auto')).not.toBeInTheDocument();
  });

  it('disables auto-translate when every other language has a value', () => {
    render(
      <Harness
        onTranslate={jest.fn()}
        initial={{ en: 'Hearing', es: 'Audiencia', fr: 'Audience' }}
      />
    );
    expect(screen.getByRole('button', { name: 'Auto-translate' })).toHaveAttribute('aria-disabled');
  });

  it('ignores a translation that finishes after the source text changed', async () => {
    let resolveFr: (value: string) => void = () => undefined;
    const onTranslate = jest.fn(
      () =>
        new Promise<string>(resolve => {
          resolveFr = resolve;
        })
    );
    render(
      <Harness onTranslate={onTranslate} initial={{ en: 'Hearing', es: '', fr: '' }} changeSource />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Auto-translate' }));
    await waitFor(() => {
      expect(onTranslate).toHaveBeenCalled();
    });
    fireEvent.click(screen.getByRole('button', { name: 'change source' }));
    resolveFr('stale-fr');
    await waitFor(() => {
      expect(screen.getByLabelText('Français title')).toHaveValue('');
    });
    expect(screen.queryByText('Auto')).not.toBeInTheDocument();
  });
});
