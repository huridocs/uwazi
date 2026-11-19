/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'jotai';
import { ThemeSelector } from '../ThemeSelector.js';
import type { ThemeVarsChange } from '../themeTokenFocus.js';

describe('ThemeSelector', () => {
  it('stacks presets, branding, and colors in one full-width column', () => {
    const { container } = render(
      <Provider>
        <ThemeSelector value={{ __preset: 'custom' }} onChange={() => undefined} panelOpen>
          <p>Theme logo</p>
        </ThemeSelector>
      </Provider>
    );
    const stack = container.firstElementChild;
    const text = stack?.textContent ?? '';
    expect(stack?.className).toBe('flex flex-col gap-6');
    expect(
      screen.getByText('Theme presets').closest('section')?.querySelector('div')?.className
    ).toBe('grid grid-cols-3 gap-3');
    expect(text.indexOf('Theme logo')).toBeGreaterThan(text.indexOf('Legacy Uwazi'));
    expect(text.indexOf('Advanced colors')).toBeGreaterThan(text.indexOf('Theme logo'));
  });

  it('parks the latest custom color when a named preset is chosen', () => {
    let current: Record<string, string | undefined> = { __preset: 'custom' };
    const onChange: ThemeVarsChange = value => {
      current = typeof value === 'function' ? value(current) : value;
    };
    render(
      <Provider>
        <ThemeSelector value={{ __preset: 'custom' }} onChange={onChange} />
      </Provider>
    );
    current = { ...current, 'light:--color-theme-accent-primary': '#112233' };
    screen.getByRole('button', { name: 'Legacy Uwazi' }).click();
    expect(current.__preset).toBe('legacy');
    expect(current['backup:light:--color-theme-accent-primary']).toBe('#112233');
  });
});
