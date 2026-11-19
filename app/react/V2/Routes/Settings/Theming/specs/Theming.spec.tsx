/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import { settingsAtom } from '#V2/atoms/settingsAtom.js';
import { Theming } from '../Theming.js';

const mockBlocker = {
  state: 'unblocked',
  proceed: jest.fn(),
  reset: jest.fn(),
};

jest.mock('react-router', () => ({
  useLoaderData: () => ({
    settings: { themeVars: { __preset: 'default' }, themeAssets: { preset: 'default' } },
    customUploadFiles: [],
  }),
  useRevalidator: () => ({ revalidate: async () => undefined }),
  useBlocker: () => mockBlocker,
}));

jest.mock('#V2/atoms/requestStatusAtom.js', () => ({
  useRequestStatus: () => ({ notify: () => undefined }),
}));

jest.mock('#V2/Components/Layouts/SettingsContent.js', () => {
  const Pane = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  return { SettingsContent: Object.assign(Pane, { Header: Pane, Body: Pane, Footer: Pane }) };
});

jest.mock('#V2/Components/ThemeSelector/index.js', () => ({
  ThemeSelector: ({
    children,
    onChange,
  }: {
    children: React.ReactNode;
    onChange: (next: Record<string, string | undefined>) => void;
  }) => (
    <div>
      <button type="button" onClick={() => onChange({ __preset: 'legacy' })}>
        Use legacy
      </button>
      {children}
    </div>
  ),
}));

jest.mock('../../Collection/Theming/CustomUploadImagePicker.tsx', () => ({
  CustomUploadImagePicker: () => null,
}));

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  t: (_ctx: string, key: string) => key,
}));

describe('Theming', () => {
  afterEach(() => {
    mockBlocker.state = 'unblocked';
  });

  it('notes that changes last only after saving the theme', () => {
    render(
      <Provider>
        <Theming />
      </Provider>
    );
    expect(
      screen.getByText('Changes stay temporary until you save the theme.')
    ).toBeInTheDocument();
  });

  it('discards unsaved theme edits', () => {
    const store = createStore();
    render(
      <Provider store={store}>
        <Theming />
      </Provider>
    );
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Use legacy' }));
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(store.get(settingsAtom).themeVars).toEqual({ __preset: 'default' });
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });

  it('asks before leaving and restores the saved theme', () => {
    const store = createStore();
    const view = render(
      <Provider store={store}>
        <Theming />
      </Provider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Use legacy' }));
    mockBlocker.state = 'blocked';
    view.rerender(
      <Provider store={store}>
        <Theming />
      </Provider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Discard' }));
    expect(store.get(settingsAtom).themeVars).toEqual({ __preset: 'default' });
    expect(mockBlocker.proceed).toHaveBeenCalled();
  });
});
