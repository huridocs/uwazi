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
  LanguageDropdown: () => null,
}));

jest.mock('#V2/Components/AIAssistant/AskBertButton', () => ({
  AskBertButton: () => null,
}));

jest.mock('../../Notifications/RequestStatus', () => ({
  RequestStatus: () => null,
}));

jest.mock('../MobileMenuDropdown', () => ({
  MobileMenuDropdown: ({ actions }: { actions?: { label: string }[] }) => (
    <div data-testid="mobile-menu">{actions?.map(action => action.label).join(',')}</div>
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

describe('Header mobile', () => {
  it('keeps Library and Sign in in the menu and lets the brand shrink', () => {
    renderHeader();

    expect(screen.getByTestId('mobile-menu')).toHaveTextContent('Library,Sign in');
    expect(screen.getByTestId('mobile-menu')).not.toHaveTextContent('Settings');
    expect(screen.queryByRole('link', { name: 'Library' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Sign in' })).not.toBeInTheDocument();
    expect(screen.getByTestId('header-brand').className).toContain('min-w-0');
    expect(screen.getByTestId('header-brand').className).not.toContain('shrink-0');
    expect(screen.getByTestId('header-brand').parentElement?.className).toContain(
      'overflow-hidden'
    );
  });
});
