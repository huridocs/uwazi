/**
 * @jest-environment jsdom
 */
import React from 'react';
import { screen } from '@testing-library/react';
import { fromJS } from 'immutable';
import { defaultState, renderConnectedContainer } from '#app/utils/test/renderConnected.js';
import { Header } from '../Header.js';

jest.mock('#app/V2/CustomHooks/useIsMobile.js', () => ({
  useIsMobile: () => true,
  MOBILE_VIEW_MAX_WIDTH: 768,
}));

jest.mock('#app/App/SiteName.js', () => ({
  SiteName: ({ className }: { className?: string }) => (
    <div data-testid="header-brand" className={className} />
  ),
}));

jest.mock('../MenuLinks', () => ({
  MenuLinks: () => null,
}));

jest.mock('../LanguageDropdown', () => ({
  LanguageDropdown: () => <button type="button">EN</button>,
}));

jest.mock('#V2/Components/AIAssistant/AskBertButton', () => ({
  AskBertButton: () => <button type="button">Ask Bert</button>,
}));

jest.mock('../../Notifications/RequestStatus', () => ({
  RequestStatus: () => null,
}));

jest.mock('../MobileMenuDropdown', () => ({
  MobileMenuDropdown: ({ actions }: { actions?: { label: string }[] }) => (
    <div data-testid="mobile-nav">{actions?.map(action => action.label).join(',')}</div>
  ),
}));

jest.mock('../MobileOptionsMenu', () => ({
  MobileOptionsMenu: ({
    actions,
    children,
  }: {
    actions?: { label: string }[];
    children?: React.ReactNode;
  }) => (
    <div data-testid="mobile-options">
      {actions?.map(action => action.label).join(',')}
      {children}
    </div>
  ),
}));

const renderHeader = () =>
  renderConnectedContainer(
    <Header />,
    () => ({
      ...defaultState,
      library: { search: {}, filters: fromJS({ properties: [] }) },
    }),
    'MemoryRouter'
  );

const mobileHeaderState = () => {
  const options = screen.getByTestId('mobile-options');
  const brand = screen.getByTestId('header-brand');
  const optionsText = options.textContent ?? '';
  const brandClass = brand.className;
  return {
    navHasLibrary: (screen.getByTestId('mobile-nav').textContent ?? '').includes('Library'),
    hasLibrary: optionsText.includes('Library'),
    hasSignIn: optionsText.includes('Sign in'),
    hasSettings: optionsText.includes('Settings'),
    languageInOptions: options.contains(screen.getByRole('button', { name: 'EN' })),
    askBertInOptions: options.contains(screen.getByRole('button', { name: 'Ask Bert' })),
    askBertInHeader: screen.getByRole('button', { name: 'Ask Bert' }) !== null,
    libraryLink: screen.queryByRole('link', { name: 'Library' }) !== null,
    signInLink: screen.queryByRole('link', { name: 'Sign in' }) !== null,
    brandShrinks: brandClass.includes('min-w-0') && !brandClass.includes('shrink-0'),
    brandClips: (brand.parentElement?.className ?? '').includes('overflow-hidden'),
  };
};

describe('Header mobile', () => {
  it('puts header options in a trailing menu and lets the brand shrink', () => {
    renderHeader();
    expect(mobileHeaderState()).toEqual({
      navHasLibrary: false,
      hasLibrary: true,
      hasSignIn: true,
      hasSettings: false,
      languageInOptions: true,
      askBertInOptions: false,
      askBertInHeader: true,
      libraryLink: false,
      signInLink: false,
      brandShrinks: true,
      brandClips: true,
    });
  });
});
