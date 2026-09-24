/**
 * @jest-environment jsdom
 */
import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fromJS } from 'immutable';
import { defaultState, renderConnectedContainer } from '#app/utils/test/renderConnected.js';
import { Header } from '../Header.js';

jest.mock('../useCompactBar', () => ({
  useCompactBar: jest.fn(() => ({ barRef: { current: null }, compact: false })),
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
  AskBertButton: () => <button type="button">Ask Bert</button>,
}));

jest.mock('../../Notifications/RequestStatus', () => ({
  RequestStatus: () => null,
}));

const { useCompactBar } = jest.requireMock('../useCompactBar');

const renderHeader = (compact: boolean) => {
  useCompactBar.mockReturnValue({ barRef: { current: null }, compact });
  return renderConnectedContainer(
    <Header />,
    () => ({
      ...defaultState,
      library: { search: {}, filters: fromJS({ properties: [] }) },
    }),
    'MemoryRouter'
  );
};

const optionsMenu = () => screen.getByRole('button', { name: 'Toggle options menu' }).parentElement;

const expectCompactMenuClosed = () => {
  const options = optionsMenu();
  expect(screen.getByRole('button', { name: 'Toggle navigation menu' })).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Library' })).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Sign in' })).not.toBeInTheDocument();
  expect(options).not.toContainElement(screen.getByRole('button', { name: 'Ask Bert' }));
  return options;
};

const expectCompactMenuOpen = (options: HTMLElement | null) => {
  expect(options).toContainElement(screen.getByRole('link', { name: 'Library' }));
  expect(options).toContainElement(screen.getByRole('link', { name: 'Sign in' }));
  expect(screen.queryByRole('link', { name: 'Settings' })).not.toBeInTheDocument();
  expect(options).toContainElement(screen.getByRole('button', { name: 'EN' }));
  expect(options).not.toContainElement(screen.getByRole('button', { name: 'Ask Bert' }));
};

describe('Header', () => {
  it('keeps secondary actions in the options menu on a compact bar', async () => {
    const user = userEvent.setup();
    renderHeader(true);
    const options = expectCompactMenuClosed();
    await user.click(screen.getByRole('button', { name: 'Toggle options menu' }));
    expectCompactMenuOpen(options);
  });

  it('shows language, library, and Ask Bert inline on a wide bar', () => {
    renderHeader(false);
    const tools = screen.getByTestId('header-tools');
    expect(screen.queryByRole('button', { name: 'Toggle options menu' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Toggle navigation menu' })
    ).not.toBeInTheDocument();
    expect(tools).toContainElement(screen.getByRole('button', { name: 'EN' }));
    expect(tools).toContainElement(screen.getByRole('link', { name: 'Library' }));
    expect(tools).toContainElement(screen.getByRole('button', { name: 'Ask Bert' }));
  });
});
