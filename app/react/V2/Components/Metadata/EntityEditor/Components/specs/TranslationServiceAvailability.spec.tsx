/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import { settingsAtom } from '#V2/atoms/index.js';
import { probeTranslationService } from '#V2/api/translationService/index.js';
import { useFieldTranslate } from '../useFieldTranslate.js';
import {
  TranslationServiceAvailabilityProvider,
  useTranslationServiceAvailability,
} from '../TranslationServiceAvailability.js';

jest.mock('#V2/api/translationService/index.js', () => ({
  probeTranslationService: jest.fn(),
}));

const holder: { resolve: (value: string) => void; signal?: AbortSignal } = {
  resolve: () => undefined,
};

const ProbeStatus = ({
  onChange = () => undefined,
  seen,
}: {
  onChange?: (value: string) => void;
  seen?: { count: number; during: number };
}) => {
  const { available, pendingCount, beginTranslation, cancelTranslations, subscribe } =
    useTranslationServiceAvailability();
  const { translate } = useFieldTranslate({
    onChange: (_language, value) => onChange(value),
    onTranslate: async (_language, signal) =>
      new Promise<string>(resolve => {
        holder.resolve = resolve;
        holder.signal = signal;
      }),
    disabled: false,
    source: 'Hearing',
  });
  React.useEffect(() => {
    if (!seen) return undefined;
    return subscribe(count => {
      seen.count = count;
    });
  }, [seen, subscribe]);
  return (
    <>
      <span>{available ? 'up' : 'down'}</span>
      <span data-testid="pending">{pendingCount}</span>
      <button type="button" onClick={() => void translate('es')}>
        translate
      </button>
      <button type="button" onClick={cancelTranslations}>
        cancel translations
      </button>
      {seen ? (
        <button
          type="button"
          onClick={() => {
            beginTranslation();
            seen.during = seen.count;
          }}
        >
          start
        </button>
      ) : null}
    </>
  );
};

const renderProbe = (onChange?: (value: string) => void) => {
  const store = createStore();
  store.set(settingsAtom, { languages: [], features: {} });
  return render(
    <Provider store={store}>
      <TranslationServiceAvailabilityProvider>
        <ProbeStatus onChange={onChange} />
      </TranslationServiceAvailabilityProvider>
    </Provider>
  );
};

const renderWithSettings = (translationService: boolean) => {
  const store = createStore();
  store.set(settingsAtom, {
    languages: [
      { key: 'en', label: 'English', default: true },
      { key: 'es', label: 'Spanish' },
    ],
    features: { translationService },
  });
  return render(
    <Provider store={store}>
      <TranslationServiceAvailabilityProvider>
        <ProbeStatus />
      </TranslationServiceAvailabilityProvider>
    </Provider>
  );
};

describe('TranslationServiceAvailabilityProvider', () => {
  beforeEach(() => {
    jest.mocked(probeTranslationService).mockReset();
  });

  it('marks the service unavailable when the probe fails', async () => {
    jest.mocked(probeTranslationService).mockResolvedValue(false);
    renderWithSettings(true);
    await waitFor(() => {
      expect(screen.getByText('down')).toBeInTheDocument();
    });
    expect(probeTranslationService).toHaveBeenCalledWith('en', 'es');
  });

  it('does not probe when the feature is off', () => {
    renderWithSettings(false);
    expect(screen.getByText('up')).toBeInTheDocument();
    expect(probeTranslationService).not.toHaveBeenCalled();
  });

  it('counts each in-flight language and clears it when the request returns empty', async () => {
    renderProbe();
    fireEvent.click(screen.getByRole('button', { name: 'translate' }));
    await waitFor(() => {
      expect(screen.getByTestId('pending')).toHaveTextContent('1');
    });
    holder.resolve('');
    await waitFor(() => {
      expect(screen.getByTestId('pending')).toHaveTextContent('0');
    });
  });

  it('drops in-flight translations on cancel so a late result does not write', async () => {
    const onChange = jest.fn();
    renderProbe(onChange);
    fireEvent.click(screen.getByRole('button', { name: 'translate' }));
    await waitFor(() => {
      expect(screen.getByTestId('pending')).toHaveTextContent('1');
    });
    fireEvent.click(screen.getByRole('button', { name: 'cancel translations' }));
    expect(holder.signal?.aborted).toBe(true);
    await waitFor(() => {
      expect(screen.getByTestId('pending')).toHaveTextContent('0');
    });
    await act(async () => {
      holder.resolve('(AI translated) Hola');
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('reports the in-flight count before the click handler returns', () => {
    const seen = { count: 0, during: 0 };
    const store = createStore();
    store.set(settingsAtom, { languages: [], features: {} });
    render(
      <Provider store={store}>
        <TranslationServiceAvailabilityProvider>
          <ProbeStatus seen={seen} />
        </TranslationServiceAvailabilityProvider>
      </Provider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'start' }));
    expect(seen.during).toBe(1);
  });

  it('leaves the count unchanged outside the provider', async () => {
    render(<ProbeStatus />);
    fireEvent.click(screen.getByRole('button', { name: 'translate' }));
    holder.resolve('Hola');
    await waitFor(() => {
      expect(screen.getByTestId('pending')).toHaveTextContent('0');
    });
  });
});
