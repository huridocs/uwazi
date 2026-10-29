/**
 * @jest-environment jsdom
 */
import React from 'react';
import { Provider } from 'jotai';
import { cleanup, render, screen } from '@testing-library/react';
import type { TextSelection } from '@huridocs/react-text-selection-handler';
import { getStore } from '#shared/atomStore/index.js';
import { settingsAtom } from '#V2/atoms/settingsAtom.js';
import { themeModeAtom, type ThemeMode } from '#V2/atoms/themeModeAtom.js';
import { ThemeProvider } from '#V2/theme/ThemeProvider.js';
import { getPresetVars } from '#V2/theme/themes.js';
import { DocumentSelectionFloatingMenu } from '../DocumentSelectionFloatingMenu.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const selection: TextSelection = {
  text: 'selected',
  selectionRectangles: [{ top: 40, left: 80, width: 60, height: 12, regionId: '1' }],
};

const mountMenu = (themed: HTMLElement) => {
  const page = document.createElement('div');
  page.id = 'page-1-container';
  page.style.position = 'relative';
  themed.appendChild(page);
  return render(
    <DocumentSelectionFloatingMenu
      selection={selection}
      onCreateRelationship={jest.fn()}
      onAddToToC={jest.fn()}
    />
  );
};

const themedRoot = () => {
  const themed = document.createElement('div');
  themed.className = 'tw-content';
  themed.setAttribute('data-theme-mode', 'light');
  themed.style.setProperty('--color-theme-action-primary', '#1A1A1A');
  themed.style.setProperty('--color-theme-text-on-solid', '#f5f0e8');
  document.body.appendChild(themed);
  return themed;
};

const lightShell = () => {
  const foreign = document.createElement('div');
  foreign.className = 'tw-content';
  foreign.dataset.themeMode = 'light';
  foreign.style.setProperty('--color-theme-bg-primary', '#ffffff');
  document.body.appendChild(foreign);
  return foreign;
};

const expectMenuMatchesShell = (shell: HTMLElement, scheme: ThemeMode) => {
  const menu = screen.getByTestId('document-selection-floating-menu');
  expect(menu.style.colorScheme).toBe(scheme);
  expect(menu.style.getPropertyValue('--color-theme-bg-primary')).toBe(
    shell.style.getPropertyValue('--color-theme-bg-primary')
  );
  return menu;
};

const renderDocumentShell = (mode: ThemeMode) => {
  const store = getStore();
  store.set(settingsAtom, { themeCustomization: true, themeVars: getPresetVars('default') });
  store.set(themeModeAtom, mode);
  const view = render(
    <Provider store={store}>
      <ThemeProvider controlledMode={mode}>
        <div id="page-1-container" />
      </ThemeProvider>
    </Provider>
  );
  render(
    <DocumentSelectionFloatingMenu
      selection={selection}
      onCreateRelationship={jest.fn()}
      onAddToToC={jest.fn()}
    />
  );
  const shell = view.container.querySelector('[data-theme-mode]');
  if (!(shell instanceof HTMLElement)) throw new Error('missing theme shell');
  return shell;
};

describe('DocumentSelectionFloatingMenu portal theme', () => {
  afterEach(cleanup);

  it('copies ThemeProvider vars onto the page chrome host', () => {
    const themed = themedRoot();
    const { unmount } = mountMenu(themed);
    const menu = screen.getByTestId('document-selection-floating-menu');
    expect(menu.parentElement?.id).toBe('page-1-container');
    expect(menu).toHaveClass('tw-content', 'tw-content--chrome');
    expect(menu.style.getPropertyValue('--color-theme-action-primary')).toBe('#1A1A1A');
    expect(menu.style.getPropertyValue('--color-theme-text-on-solid')).toBe('#f5f0e8');
    expect(menu.querySelector('.bg-ink')).not.toBeNull();
    unmount();
    themed.remove();
  });

  it('uses compiling white opacity classes on the ink bar', () => {
    const themed = themedRoot();
    const { unmount } = mountMenu(themed);
    const create = screen.getByRole('button', { name: 'Create relationship' });
    const toc = screen.getByRole('button', { name: 'Add to ToC' });
    expect(create.className).toContain('hover:bg-white/15');
    expect(create.className).not.toContain('bg-paper/15');
    expect(toc.className).toContain('text-white/80');
    expect(toc.className).not.toContain('text-parchment/80');
    unmount();
    themed.remove();
  });

  it('copies a light document shell onto the selection menu', () => {
    const shell = renderDocumentShell('light');
    expect(shell).not.toHaveClass('dark');
    expectMenuMatchesShell(shell, 'light');
  });

  it('copies the document shell theme when another shell is light', () => {
    const foreign = lightShell();
    const shell = renderDocumentShell('dark');
    expect(shell).toHaveClass('dark');
    const menu = expectMenuMatchesShell(shell, 'dark');
    expect(menu.style.getPropertyValue('--color-theme-bg-primary')).not.toBe('#ffffff');
    foreign.remove();
  });
});
