import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { BrowserRouter } from 'react-router';
import { Provider as ReduxProvider } from 'react-redux';
import { createStore, Provider } from 'jotai';
import { LEGACY_createStore as createReduxStore } from '#V2/testing/index.js';
import { Header } from '#V2/Components/UI/Header/Header.js';
import { userAtom, settingsAtom, localeAtom, translationsAtom } from '#V2/atoms/index.js';
import { ThemeProvider } from '#V2/theme/ThemeProvider.js';
import {
  ACCENT_PRIMARY_KEY,
  appliedTheme,
  getPresetVars,
  SEMANTIC_VAR_LABELS,
  THEME_PALETTE,
} from '#V2/theme/themes.js';
import { checkContrast, getContrastTextColor } from '#shared/utils/contrast.js';
import type { ClientSettings, ClientUserSchema } from '#app/apiResponseTypes.js';

const baseSettings: ClientSettings = {
  site_name: 'Uwazi',
  private: false,
  defaultLibraryView: 'cards',
  links: [{ _id: '1', title: 'Library', url: '/library', type: 'link' }],
  languages: [{ key: 'en', label: 'English', default: true }],
};

const createStoreWithTheme = (themeVars?: Record<string, string>, authenticated = true) => {
  const store = createStore();
  const user: ClientUserSchema | undefined = authenticated
    ? { _id: '1', username: 'admin', role: 'admin', email: 'admin@uwazi.io' }
    : undefined;
  store.set(userAtom, user);
  store.set(settingsAtom, { ...baseSettings, themeVars: themeVars ?? {} });
  store.set(localeAtom, 'en');
  store.set(translationsAtom, []);
  return store;
};

const THEME_NONE = 'none';
const themeSelectOptions = [THEME_NONE, ...THEME_PALETTE.map(p => p.id)];
const themeSelectMapping: Record<string, Record<string, string>> = {
  [THEME_NONE]: {},
  ...Object.fromEntries(THEME_PALETTE.map(p => [p.id, { [ACCENT_PRIMARY_KEY]: p.hex }])),
};
const themeSelectLabels: Record<string, string> = {
  [THEME_NONE]: 'None',
  ...Object.fromEntries(THEME_PALETTE.map(p => [p.id, SEMANTIC_VAR_LABELS[p.semanticKey]])),
};

const ThemeContrastHint = ({ themeVars }: { themeVars: Record<string, string> }) => {
  const resolved = appliedTheme(themeVars);
  const accent = resolved[ACCENT_PRIMARY_KEY] ?? '#1A1A1A';
  const fg = getContrastTextColor(accent);
  const contrast = checkContrast(accent, fg);
  return (
    <p className="px-4 py-2 text-xs text-gray-500 border-t border-gray-100" aria-live="polite">
      Contrast {contrast.ratio.toFixed(1)}:1
      {contrast.passesAA && ' ✓ AA'}
      {contrast.passesAAA && ' ✓ AAA'}
    </p>
  );
};

const reduxStore = createReduxStore();

type HeaderWithThemeProps = {
  themeVarsKey?: string;
  themeVars?: Record<string, string>;
  authenticated: boolean;
};

const HeaderWithTheme = ({
  themeVarsKey = THEME_NONE,
  themeVars: themeVarsProp,
  authenticated,
}: HeaderWithThemeProps) => {
  const themeVars = themeVarsProp ?? themeSelectMapping[themeVarsKey] ?? {};
  const store = React.useMemo(
    () =>
      createStoreWithTheme(
        Object.keys(themeVars).length > 0 ? themeVars : undefined,
        authenticated
      ),
    [themeVars, authenticated]
  );
  return (
    <ReduxProvider store={reduxStore}>
      <Provider store={store}>
        {Object.keys(themeVars).length > 0 ? (
          <>
            <ThemeProvider>
              <Header />
            </ThemeProvider>
            <ThemeContrastHint themeVars={themeVars} />
          </>
        ) : (
          <Header />
        )}
      </Provider>
    </ReduxProvider>
  );
};

const meta: Meta<typeof HeaderWithTheme> = {
  title: 'Components/UI/Header',
  component: HeaderWithTheme,
  argTypes: {
    themeVarsKey: {
      options: themeSelectOptions,
      control: { type: 'select', labels: themeSelectLabels },
    },
  },
  decorators: [
    Story => (
      <BrowserRouter>
        <div className="tw-content w-full">
          <Story />
        </div>
      </BrowserRouter>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof HeaderWithTheme>;

const Default: Story = {
  args: { themeVarsKey: THEME_NONE, authenticated: true },
};

const WithThemeSelector: Story = {
  args: { themeVarsKey: 'accent-primary', authenticated: true },
};

const Unauthenticated: Story = {
  args: { themeVarsKey: THEME_NONE, authenticated: false },
};

const WithNamedTheme: Story = {
  render: () => <HeaderWithTheme themeVars={getPresetVars('light')} authenticated={true} />,
};

const WithSiteLogo: Story = {
  render: () => {
    const store = createStore();
    const user: ClientUserSchema = { _id: '1', username: 'admin', role: 'admin', email: 'a@b.c' };
    store.set(userAtom, user);
    store.set(settingsAtom, {
      ...baseSettings,
      themeCustomization: true,
      site_logo: 'https://via.placeholder.com/120x32',
    });
    store.set(localeAtom, 'en');
    store.set(translationsAtom, []);
    return (
      <ReduxProvider store={reduxStore}>
        <Provider store={store}>
          <ThemeProvider>
            <Header />
          </ThemeProvider>
        </Provider>
      </ReduxProvider>
    );
  },
};

export { Default, WithThemeSelector, Unauthenticated, WithNamedTheme, WithSiteLogo };
