/**
 * @jest-environment jsdom
 */
import React from 'react';
import { Provider } from 'jotai';
import { render, screen } from '@testing-library/react';
import { getStore } from '#shared/atomStore/index.js';
import { settingsAtom } from '#V2/atoms/settingsAtom.js';
import { themeControlledModeAtom } from '#V2/atoms/effectiveThemeModeAtom.js';
import { themeModeAtom } from '#V2/atoms/themeModeAtom.js';
import { getRelativeLuminanceFromHex } from '#shared/utils/contrast.js';
import { ThemeProvider } from '#V2/theme/ThemeProvider.js';
import { useTemplatePillColors } from '#V2/theme/useTemplatePillColors.js';

const Probe = ({ color }: { color: string }) => {
  const { background } = useTemplatePillColors(color);
  return <span data-testid="pill-bg">{background}</span>;
};

describe('useTemplatePillColors', () => {
  it('follows ThemeProvider scopedMode when the global mode is dark', () => {
    const store = getStore();
    store.set(settingsAtom, { themeCustomization: true });
    store.set(themeModeAtom, 'dark');
    store.set(themeControlledModeAtom, 'dark');

    render(
      <Provider store={store}>
        <ThemeProvider scopedMode="light">
          <Probe color="#FACA15" />
        </ThemeProvider>
      </Provider>
    );

    expect(
      getRelativeLuminanceFromHex(screen.getByTestId('pill-bg').textContent ?? '')
    ).toBeGreaterThan(0.7);
  });

  it('follows ThemeProvider when it tracks the global dark mode', () => {
    const store = getStore();
    store.set(settingsAtom, { themeCustomization: true });
    store.set(themeModeAtom, 'dark');
    store.set(themeControlledModeAtom, 'dark');

    render(
      <Provider store={store}>
        <ThemeProvider>
          <Probe color="#FACA15" />
        </ThemeProvider>
      </Provider>
    );

    expect(
      getRelativeLuminanceFromHex(screen.getByTestId('pill-bg').textContent ?? '')
    ).toBeLessThan(0.3);
  });
});
