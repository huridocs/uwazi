/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import { settingsAtom } from '#V2/atoms/index.js';
import { probeTranslationService } from '#V2/api/translationService/index.js';
import {
  TranslationServiceAvailabilityProvider,
  useTranslationServiceAvailability,
} from '../TranslationServiceAvailability.js';

jest.mock('#V2/api/translationService/index.js', () => ({
  probeTranslationService: jest.fn(),
}));

const ProbeStatus = () => {
  const { available } = useTranslationServiceAvailability();
  return <span>{available ? 'up' : 'down'}</span>;
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
});
