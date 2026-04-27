import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { BrowserRouter } from 'react-router';
import { Provider as ReduxProvider } from 'react-redux';
import { createStore, Provider } from 'jotai';
import { LEGACY_createStore as createReduxStore } from '#V2/testing/index.js';
import { Header } from '#V2/Components/UI/Header/Header.js';
import {
  userAtom,
  settingsAtom,
  localeAtom,
  themeModeAtom,
  translationsAtom,
} from '#V2/atoms/index.js';
import { ThemeProvider } from '#V2/theme/ThemeProvider.js';
import {
  ACCENT_PRIMARY_KEY,
  appliedTheme,
  SEMANTIC_VAR_LABELS,
  THEME_PALETTE,
} from '#V2/theme/themes.js';
import { checkContrast, getContrastTextColor } from '#shared/utils/contrast.js';
import type { ClientSettings, ClientUserSchema } from '#app/apiResponseTypes.js';
import {
  buildStorybookThemeVars,
  normalizeStorybookThemeMode,
  normalizeStorybookThemePreset,
  type StorybookThemePreset,
  type ThemeMode,
} from './storybookTheme.js';

const baseSettings: ClientSettings = {
  site_name: 'Uwazi',
  private: false,
  defaultLibraryView: 'cards',
  links: [{ _id: '1', title: 'Library', url: '/library', type: 'link' }],
  languages: [{ key: 'en', label: 'English', default: true }],
};

const createStoreWithTheme = (
  themeVars: Record<string, string>,
  themeMode: ThemeMode,
  authenticated = true
) => {
  const store = createStore();
  const user: ClientUserSchema | undefined = authenticated
    ? { _id: '1', username: 'admin', role: 'admin', email: 'admin@uwazi.io' }
    : undefined;
  store.set(userAtom, user);
  store.set(settingsAtom, {
    ...baseSettings,
    themeCustomization: true,
    themeVars,
  });
  store.set(themeModeAtom, themeMode);
  store.set(localeAtom, 'en');
  store.set(translationsAtom, []);
  return store;
};

const THEME_NONE = 'none' as const;
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
  const resolved = appliedTheme(themeVars, 'light');
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
  themeMode: ThemeMode;
  themePreset: StorybookThemePreset;
};

const HeaderWithTheme = ({
  themeVarsKey = THEME_NONE,
  themeVars: themeVarsProp,
  authenticated,
  themeMode,
  themePreset,
}: HeaderWithThemeProps) => {
  const themeVars = themeVarsProp ?? {
    ...buildStorybookThemeVars(themePreset),
    ...(themeSelectMapping[themeVarsKey] ?? {}),
  };
  const store = React.useMemo(
    () => createStoreWithTheme(themeVars, themeMode, authenticated),
    [authenticated, themeMode, themeVars]
  );

  return (
    <ReduxProvider store={reduxStore}>
      <Provider store={store}>
        <>
          <ThemeProvider controlledMode={themeMode}>
            <Header />
          </ThemeProvider>
          <ThemeContrastHint themeVars={themeVars} />
        </>
      </Provider>
    </ReduxProvider>
  );
};

const meta: Meta<typeof HeaderWithTheme> = {
  title: 'Components/UI/Header',
  component: HeaderWithTheme,
  args: {
    authenticated: true,
    themeMode: 'light',
    themePreset: 'default',
    themeVarsKey: THEME_NONE,
  },
  argTypes: {
    themeVarsKey: {
      options: themeSelectOptions,
      control: { type: 'select', labels: themeSelectLabels },
    },
    themeMode: { control: false },
    themePreset: { control: false },
  },
  decorators: [
    (Story, context) => (
      <BrowserRouter>
        <div className="w-full">
          <Story
            args={{
              ...context.args,
              themeMode: normalizeStorybookThemeMode(context.globals.uwaziThemeMode),
              themePreset: normalizeStorybookThemePreset(context.globals.uwaziThemePreset),
            }}
          />
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

export { Default, WithThemeSelector, Unauthenticated };
