/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeColorsSection } from '../ThemeColorsSection.js';
import type { ThemeVarsChange } from '../themeTokenFocus.js';

const noop = () => undefined;

describe('ThemeColorsSection', () => {
  it('adds full mode on top of the latest theme vars', () => {
    let current: Record<string, string | undefined> = { __preset: 'custom' };
    const onChange: ThemeVarsChange = value => {
      current = typeof value === 'function' ? value(current) : value;
    };
    render(
      <ThemeColorsSection
        previewMode="light"
        selectedPreset="custom"
        themeVars={{ __preset: 'custom' }}
        resolvedPreviewTheme={{}}
        resolvedMergedPreview={{}}
        colorOptions={[]}
        updateModeVar={noop}
        updateChromeModeVar={noop}
        onImportThemeInstanceText={noop}
        onChange={onChange}
        setSimpleChromeBar={noop}
      />
    );
    current = { ...current, 'light:--color-theme-accent-primary': '#112233' };
    screen.getByRole('button', { name: 'Full mode' }).click();
    expect(current.__themeEditorMode).toBe('advanced');
    expect(current['light:--color-theme-accent-primary']).toBe('#112233');
  });

  it('recomputes simple mode from the latest theme vars', () => {
    let current: Record<string, string | undefined> = { __preset: 'custom' };
    const onChange: ThemeVarsChange = value => {
      current = typeof value === 'function' ? value(current) : value;
    };
    render(
      <ThemeColorsSection
        previewMode="light"
        selectedPreset="custom"
        themeVars={{ __preset: 'custom' }}
        resolvedPreviewTheme={{}}
        resolvedMergedPreview={{}}
        colorOptions={[]}
        updateModeVar={noop}
        updateChromeModeVar={noop}
        onImportThemeInstanceText={noop}
        onChange={onChange}
        setSimpleChromeBar={noop}
      />
    );
    current = { ...current, 'light:--color-theme-accent-primary': '#112233' };
    screen.getByRole('button', { name: 'Simple mode' }).click();
    expect(current.__themeEditorMode).toBe('simple');
    expect(current['light:--color-theme-accent-primary']).toBe('#112233');
  });
});
