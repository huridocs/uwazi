import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { MemoryRouter } from 'react-router';
import { Provider as ReduxProvider } from 'react-redux';
import { createStore, Provider } from 'jotai';
import { LEGACY_createStore as createReduxStore } from '#V2/testing/index.js';
import { Header } from '#V2/Components/UI/Header/Header.js';
import { userAtom, settingsAtom, localeAtom, translationsAtom } from '#V2/atoms/index.js';
import { checkContrast, getContrastTextColor } from '#shared/utils/contrast.js';
import { ThemeSelector } from '#V2/Components/ThemeSelector/index.js';
import { getDerivedThemeVars } from '#V2/theme/ThemeProvider.js';
import { ACCENT_PRIMARY_KEY, appliedTheme } from '#V2/theme/themes.js';
import type { ClientSettings, ClientUserSchema } from '#app/apiResponseTypes.js';

const baseSettings: ClientSettings = {
  site_name: 'Uwazi',
  private: false,
  defaultLibraryView: 'cards',
  links: [{ _id: '1', title: 'Library', url: '/library', type: 'link' }],
  languages: [{ key: 'en', label: 'English', default: true }],
};

type ThemePickerWithPreviewProps = { themeCustomization: boolean };

const ThemePickerWithPreview = ({ themeCustomization }: ThemePickerWithPreviewProps) => {
  const [themeVars, setThemeVars] = useState<Record<string, string | undefined>>({});
  const resolved = appliedTheme(themeVars, 'light', themeCustomization);
  const accent = resolved[ACCENT_PRIMARY_KEY] ?? '#1A1A1A';
  const style: React.CSSProperties & Record<string, string> = {
    ...resolved,
    ...getDerivedThemeVars(accent),
  };
  const fg = getContrastTextColor(accent);
  const contrast = checkContrast(accent, fg);
  const store = React.useMemo(() => {
    const s = createStore();
    const user: ClientUserSchema = {
      _id: '1',
      username: 'admin',
      role: 'admin',
      email: 'admin@uwazi.io',
    };
    s.set(userAtom, user);
    s.set(settingsAtom, { ...baseSettings, themeCustomization, themeVars });
    s.set(localeAtom, 'en');
    s.set(translationsAtom, []);
    return s;
  }, [themeVars]);

  if (!themeCustomization) {
    return (
      <div className="tw-content p-4 text-sm text-gray-500">
        Theme customization is disabled. Enable the feature flag to use the theme picker.
      </div>
    );
  }

  return (
    <div className="tw-content flex flex-col gap-6 p-4">
      <ThemeSelector value={themeVars} onChange={setThemeVars} />
      <section>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Preview</h3>
        <ReduxProvider store={createReduxStore()}>
          <Provider store={store}>
            <div
              className="tw-content rounded border border-gray-200"
              data-theme-custom
              style={style}
            >
              <Header />
              <p
                className="px-4 py-2 text-xs border-t"
                style={{
                  borderColor: 'var(--color-theme-brand-surface-foreground)',
                  color: 'var(--color-theme-brand-surface-foreground)',
                  opacity: 0.9,
                }}
                aria-live="polite"
              >
                Header contrast {contrast.ratio.toFixed(1)}:1
                {contrast.passesAA && ' ✓ AA'}
                {contrast.passesAAA && ' ✓ AAA'}
              </p>
            </div>
          </Provider>
        </ReduxProvider>
      </section>
    </div>
  );
};

const meta: Meta<typeof ThemePickerWithPreview> = {
  title: 'Settings/ThemePicker',
  component: ThemePickerWithPreview,
  args: { themeCustomization: true },
  argTypes: { themeCustomization: { control: 'boolean' } },
  decorators: [
    Story => (
      <MemoryRouter initialEntries={['/en/library']}>
        <Story />
      </MemoryRouter>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof ThemePickerWithPreview>;

export const NamedThemesAndPalette: Story = {
  args: { themeCustomization: true },
};

export const FlagOff: Story = {
  args: { themeCustomization: false },
};
