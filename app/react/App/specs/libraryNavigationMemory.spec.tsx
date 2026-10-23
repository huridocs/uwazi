/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, screen, waitFor } from '@testing-library/react';
import { fromJS } from 'immutable';
import { defaultState, renderConnectedContainer } from '#app/utils/test/renderConnected.js';
import { TestAtomStoreProvider } from '#V2/testing/TestAtomStoreProvider.js';
import { localeAtom, settingsAtom } from '#V2/atoms/index.js';
import { Header } from '#V2/Components/UI/Header/Header.js';
import {
  LIBRARY_FILTERS_STORAGE_KEY,
  writeStoredLibraryFilters,
} from '#V2/Routes/Library/libraryFiltersStorage.js';
import { Menu } from '../Menu.js';
import { Footer } from '../Footer.js';

jest.mock('#V2/Components/UI/Header/useCompactBar.js', () => ({
  useCompactBar: () => ({ barRef: { current: null }, compact: false }),
}));
jest.mock('#app/App/SiteName.js', () => ({ SiteName: () => null }));
jest.mock('#V2/Components/UI/Header/MenuLinks.js', () => ({ MenuLinks: () => null }));
jest.mock('#V2/Components/UI/Header/LanguageDropdown.js', () => ({ LanguageDropdown: () => null }));
jest.mock('#V2/Components/UI/Notifications/RequestStatus.js', () => ({
  RequestStatus: () => null,
}));

const settings = {
  features: { featureFlagLibraryV2: true },
  languages: [{ key: 'en', label: 'English', default: true }],
  defaultLibraryView: 'table',
  links: [],
};
const storeState = {
  ...defaultState,
  user: fromJS({}),
  settings: { collection: fromJS(settings) },
  library: { search: {}, filters: fromJS({ properties: [], documentTypes: [] }) },
};

const renderNavigation = (navigation: React.ReactElement) =>
  renderConnectedContainer(
    <TestAtomStoreProvider
      initialValues={[
        [localeAtom, 'en'],
        [settingsAtom, settings],
      ]}
    >
      {navigation}
    </TestAtomStoreProvider>,
    () => storeState,
    'MemoryRouter',
    ['/en/page/example']
  );

describe.each([
  ['Header', <Header key="header" />, '/en/library'],
  [
    'legacy Menu',
    <Menu key="menu" className="menu" isMobile={false} toggleMobileMenu={() => {}} />,
    '/en/library/table',
  ],
  ['Footer', <Footer key="footer" />, '/en/library/table'],
])('%s remembered library link', (_name, navigation, path) => {
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem(
      LIBRARY_FILTERS_STORAGE_KEY,
      JSON.stringify({ filters: { type: ['tpl-saved'] }, andFilters: ['type'] })
    );
  });

  it('includes remembered filters in the localized href, preserving the target view', async () => {
    renderNavigation(navigation as React.ReactElement);

    await waitFor(() =>
      expect(screen.getByRole('link', { name: 'Library' })).toHaveAttribute(
        'href',
        `${path}?filters=(type:(tpl-saved))&andFilters=(type)`
      )
    );
  });

  it('refreshes the href after a filter patch even without navigating', async () => {
    renderNavigation(navigation as React.ReactElement);
    await act(async () =>
      writeStoredLibraryFilters({ filters: { type: ['tpl-next'] }, andFilters: [] })
    );
    expect(screen.getByRole('link', { name: 'Library' })).toHaveAttribute(
      'href',
      `${path}?filters=(type:(tpl-next))`
    );
    await act(async () => writeStoredLibraryFilters({ filters: {}, andFilters: [] }));

    await waitFor(() =>
      expect(screen.getByRole('link', { name: 'Library' })).toHaveAttribute('href', path)
    );
  });
});
