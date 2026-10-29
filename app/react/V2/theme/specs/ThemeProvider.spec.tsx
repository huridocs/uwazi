/**
 * @jest-environment jsdom
 */
import React from 'react';
import { Provider } from 'jotai';
import { render, screen } from '@testing-library/react';
import { getStore } from '#shared/atomStore/index.js';
import { getRelativeLuminanceFromHex } from '#shared/utils/contrast.js';
import { settingsAtom } from '#V2/atoms/settingsAtom.js';
import { themeControlledModeAtom } from '#V2/atoms/effectiveThemeModeAtom.js';
import { themeModeAtom } from '#V2/atoms/themeModeAtom.js';
import { ThemeProvider } from '#V2/theme/ThemeProvider.js';
import { useTemplatePillColors } from '#V2/theme/useTemplatePillColors.js';
import { getPresetVars } from '#V2/theme/themes.js';
import { PRESET_DEFINITIONS, type ThemePresetId } from '#V2/theme/tokens.js';

const mountProvider = (presetId: ThemePresetId, customization: boolean) => {
  const store = getStore();
  store.set(settingsAtom, {
    themeCustomization: customization,
    themeVars: getPresetVars(presetId),
  });
  store.set(themeModeAtom, 'dark');
  store.set(themeControlledModeAtom, 'dark');
  return render(
    <Provider store={store}>
      <ThemeProvider>child</ThemeProvider>
    </Provider>
  );
};

const PillProbe = () => {
  const { background } = useTemplatePillColors('#C03B22');
  return <span data-testid="pill-bg">{background}</span>;
};

const renderOnLightPage = () => {
  const painted = document.createElement('div');
  painted.dataset.themeMode = 'light';
  document.body.appendChild(painted);
  const store = getStore();
  store.set(settingsAtom, {
    themeCustomization: true,
    themeVars: getPresetVars('default'),
  });
  store.set(themeModeAtom, 'dark');
  store.set(themeControlledModeAtom, undefined);
  const view = render(
    <Provider store={store}>
      <ThemeProvider>
        <PillProbe />
      </ThemeProvider>
    </Provider>
  );
  return { painted, shell: view.container.firstElementChild as HTMLElement };
};

describe('ThemeProvider dark wiring', () => {
  (['default', 'legacy'] as const).forEach(presetId => {
    it(`applies ${presetId} dark class, mode, and canvas tokens`, () => {
      const { container } = mountProvider(presetId, true);
      const root = container.firstElementChild as HTMLElement;
      const { dark } = PRESET_DEFINITIONS[presetId].modes;
      expect(root).toHaveClass('tw-content', 'dark');
      expect(root).toHaveAttribute('data-theme-mode', 'dark');
      expect(root).toHaveAttribute('data-theme-preset', presetId);
      expect(root.style.getPropertyValue('--color-theme-bg-primary')).toBe(
        dark['--color-theme-bg-primary']
      );
      expect(root.style.getPropertyValue('--text-primary')).toBe(
        dark['--color-theme-text-primary']
      );
    });
  });

  it('keeps pills on the selected light theme', () => {
    const { painted, shell } = renderOnLightPage();
    const { light } = PRESET_DEFINITIONS.default.modes;
    expect(shell).toHaveAttribute('data-theme-mode', 'light');
    expect(shell).not.toHaveClass('dark');
    expect(shell.style.getPropertyValue('--color-theme-bg-warm')).toBe(
      light['--color-theme-bg-warm']
    );
    expect(
      getRelativeLuminanceFromHex(screen.getByTestId('pill-bg').textContent ?? '')
    ).toBeGreaterThan(0.45);
    painted.remove();
  });

  it('stays light when theme customization is off', () => {
    const { container } = mountProvider('legacy', false);
    const root = container.firstElementChild as HTMLElement;
    expect(root).not.toHaveClass('dark');
    expect(root).toHaveAttribute('data-theme-mode', 'light');
    expect(root.style.getPropertyValue('--color-theme-bg-primary')).toBe(
      PRESET_DEFINITIONS.legacy.modes.light['--color-theme-bg-primary']
    );
  });
});
