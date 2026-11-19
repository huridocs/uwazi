/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import { settingsAtom } from '#V2/atoms/settingsAtom.js';
import { themeModeAtom } from '#V2/atoms/themeModeAtom.js';
import { SiteName } from '#app/App/SiteName.js';
import { ThemeProvider } from '#V2/theme/ThemeProvider.js';
import { themeAssetsForPreset } from '#V2/theme/themes.js';

jest.mock('#app/I18N/index.js', () => ({
  I18NLink: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <a href="/" className={className}>
      {children}
    </a>
  ),
}));

jest.mock('react-helmet', () => ({
  Helmet: () => null,
}));

describe('SiteName', () => {
  it('uses the painted light logo when the stored mode is dark', () => {
    const painted = document.createElement('div');
    painted.dataset.themeMode = 'light';
    document.body.appendChild(painted);
    const store = createStore();
    store.set(settingsAtom, {
      themeCustomization: true,
      site_name: 'Uwazi',
      themeVars: { __preset: 'default' },
      themeAssets: themeAssetsForPreset(undefined, 'default'),
    });
    store.set(themeModeAtom, 'dark');
    const { container } = render(
      <Provider store={store}>
        <ThemeProvider>
          <SiteName />
        </ThemeProvider>
      </Provider>
    );
    expect(container.querySelector('img')?.getAttribute('src')).toBe(
      '/public/uwazi-design-logo.svg'
    );
    painted.remove();
  });
});
