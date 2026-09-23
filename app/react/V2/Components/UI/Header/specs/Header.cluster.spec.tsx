/**
 * @jest-environment jsdom
 */
import React from 'react';
import { screen } from '@testing-library/react';
import { fromJS } from 'immutable';
import { defaultState, renderConnectedContainer } from '#app/utils/test/renderConnected.js';
import { Header } from '../Header.js';

jest.mock('../useCompactBar', () => ({
  useCompactBar: () => ({ barRef: { current: null }, compact: false }),
}));

jest.mock('#app/App/SiteName.js', () => ({
  SiteName: () => <div data-testid="header-brand" />,
}));

jest.mock('../MenuLinks', () => ({
  MenuLinks: () => null,
}));

jest.mock('../LanguageDropdown', () => ({
  LanguageDropdown: () => <button type="button">EN</button>,
}));

jest.mock('#V2/Components/AIAssistant/AskBertButton', () => ({
  AskBertButton: () => null,
}));

jest.mock('../../Notifications/RequestStatus', () => ({
  RequestStatus: () => null,
}));

jest.mock('../MobileMenuDropdown', () => ({
  MobileMenuDropdown: () => null,
}));

jest.mock('../MobileOptionsMenu', () => ({
  MobileOptionsMenu: () => <div data-testid="mobile-options" />,
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

describe('Header tools cluster', () => {
  it('keeps the inline tools behind the md breakpoint when the window is wide', () => {
    renderHeader();
    expect(screen.getByTestId('header-tools-menu')).toHaveClass('md:hidden');
    expect(screen.getByTestId('header-tools')).toHaveClass('hidden', 'md:flex');
    expect(screen.getByTestId('header-tools-menu')).toContainElement(
      screen.getByTestId('mobile-options')
    );
  });
});
