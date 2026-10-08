/**
 * @jest-environment jsdom
 */
import React from 'react';
import { createStore, Provider } from 'jotai';
import { render, screen } from '@testing-library/react';
import { settingsAtom } from '#V2/atoms/settingsAtom.js';
import { themeControlledModeAtom } from '#V2/atoms/effectiveThemeModeAtom.js';
import { Tooltip } from '../Tooltip.js';

const tip = () => screen.getByTestId('flowbite-tooltip');
const arrow = () => screen.getByTestId('flowbite-tooltip-arrow');

const renderInDarkTheme = (node: React.ReactElement) => {
  const store = createStore();
  store.set(settingsAtom, { themeCustomization: true });
  store.set(themeControlledModeAtom, 'dark');
  return render(<Provider store={store}>{node}</Provider>);
};

describe('Tooltip', () => {
  it('uses the light surface in a light theme', () => {
    render(
      <Tooltip content="Entity view">
        <button type="button">View</button>
      </Tooltip>
    );
    expect(tip()).toHaveClass('tooltip-light-surface');
    expect(arrow()).toHaveClass('h-2', 'w-2', 'rotate-45', 'bg-paper');
  });

  it('uses an ink surface and a diamond arrow in a light theme', () => {
    render(
      <Tooltip content="Entity view" tone="ink">
        <button type="button">View</button>
      </Tooltip>
    );
    expect(tip()).toHaveClass('bg-ink', 'text-parchment');
    expect(tip()).not.toHaveClass('tooltip-light-surface');
    expect(arrow()).toHaveClass('h-2', 'w-2', 'rotate-45', 'bg-ink');
  });

  it('uses the ink surface in a dark theme', () => {
    renderInDarkTheme(
      <Tooltip content="Entity view">
        <button type="button">View</button>
      </Tooltip>
    );
    expect(tip()).toHaveClass('bg-ink', 'text-parchment');
    expect(tip()).not.toHaveClass('tooltip-light-surface');
    expect(arrow()).toHaveClass('h-2', 'w-2', 'rotate-45', 'bg-ink');
  });
});
