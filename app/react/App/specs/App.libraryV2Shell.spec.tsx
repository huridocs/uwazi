/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { TestAtomStoreProvider } from '#V2/testing/TestAtomStoreProvider.js';
import { settingsAtom, userAtom } from '#V2/atoms/index.js';
import { App } from '#app/App/App.js';

jest.mock('#app/V2/Components/UI/Header/Header.js', () => ({
  Header: () => <div data-testid="mock-header" data-uwazi-header className="header-bar" />,
}));
jest.mock('#app/App/LegacyHeader.js', () => ({
  LegacyHeader: () => <div data-testid="mock-legacy-header" />,
}));
jest.mock('#app/V2/Components/Analitycs/index.js', () => ({
  Matomo: () => null,
  CleanInsights: () => null,
}));
jest.mock('#app/App/GoogleAnalytics.js', () => ({ GoogleAnalytics: () => null }));
jest.mock('#app/V2/Components/AIAssistant/BertHost.js', () => ({ BertHost: () => null }));
jest.mock('#V2/Components/UI/Notifications/NotificationsPanel.js', () => ({
  NotificationsPanel: () => null,
}));
jest.mock('#app/App/Cookiepopup.js', () => ({ Cookiepopup: () => null }));
jest.mock('#app/App/Confirm.js', () => ({ Confirm: () => null }));
jest.mock('#app/I18N/index.js', () => ({
  TranslateModal: () => null,
}));

const adminUser = { _id: 'admin1', role: 'admin', username: 'admin', email: 'admin@uwazi.io' };

const renderAppAt = (pathname: string, featureFlagLibraryV2: boolean) => {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <App />,
        children: [
          {
            path: 'en/libraryv2/*',
            element: <div data-testid="library-v2-outlet">Library V2</div>,
          },
          {
            path: 'en/library/*',
            element: <div data-testid="library-outlet">Library</div>,
          },
        ],
      },
    ],
    { initialEntries: [pathname] }
  );

  return render(
    <TestAtomStoreProvider
      initialValues={[
        [
          settingsAtom,
          {
            languages: [{ key: 'en', label: 'English', default: true }],
            features: { newHeader: true, featureFlagLibraryV2 },
          },
        ],
        [userAtom, adminUser],
      ]}
    >
      <RouterProvider router={router} />
    </TestAtomStoreProvider>
  );
};

describe('App Library V2 shell', () => {
  it('keeps the V2 shell on /libraryv2 when featureFlagLibraryV2 is off', () => {
    renderAppAt('/en/libraryv2', false);

    expect(screen.getByTestId('library-v2-outlet')).toBeInTheDocument();
    const main = document.getElementById('main');
    expect(main).toBeTruthy();
    expect(main?.className.includes('container-fluid')).toBe(false);
    // Shared V2 shell: flex main under the new header (not the legacy container-fluid layout).
    expect(Boolean(main?.getAttribute('style')?.includes('flex'))).toBe(true);
  });

  it('keeps the V2 shell on /library when featureFlagLibraryV2 is on', () => {
    renderAppAt('/en/library', true);

    expect(screen.getByTestId('library-outlet')).toBeInTheDocument();
    const main = document.getElementById('main');
    expect(main?.className.includes('container-fluid')).toBe(false);
    expect(Boolean(main?.getAttribute('style')?.includes('flex'))).toBe(true);
  });
});
