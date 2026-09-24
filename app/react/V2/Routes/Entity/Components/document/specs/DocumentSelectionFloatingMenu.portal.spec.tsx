/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import type { TextSelection } from '@huridocs/react-text-selection-handler';
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
  themed.appendChild(page);
  return render(
    <DocumentSelectionFloatingMenu
      selection={selection}
      onCreateRelationship={jest.fn()}
      onAddToToC={jest.fn()}
    />,
    { container: themed }
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

describe('DocumentSelectionFloatingMenu portal theme', () => {
  it('copies ThemeProvider vars onto the body chrome host', () => {
    const themed = themedRoot();
    const { unmount } = mountMenu(themed);
    const menu = screen.getByTestId('document-selection-floating-menu');
    expect(menu.parentElement).toBe(document.body);
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
});
