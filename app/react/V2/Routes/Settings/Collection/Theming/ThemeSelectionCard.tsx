import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { Button } from '#V2/Components/UI/index.js';
import { ACCENT_PRIMARY_KEY, appliedTheme, getPresetId, NAMED_THEMES } from '#V2/theme/themes.js';
import { FileType } from '#shared/types/fileType.js';
import { ThemeSettingsSidepanel } from './ThemeSettingsSidepanel.js';

type ThemeSelectionCardProps = {
  themeVars: Record<string, string | undefined>;
  onThemeChange: (next: Record<string, string | undefined>) => void;
  themeAssets: {
    preset?: 'default' | 'legacy';
    siteLogo?: Partial<Record<'light' | 'dark', string>>;
    favicon?: Partial<Record<'light' | 'dark', string>>;
  };
  onThemeAssetsChange: (next: ThemeSelectionCardProps['themeAssets']) => void;
  siteLogo?: string;
  favicon?: string;
  customUploadFiles: FileType[];
};

const ThemeSelectionCard = ({
  themeVars,
  onThemeChange,
  themeAssets,
  onThemeAssetsChange,
  siteLogo,
  favicon,
  customUploadFiles,
}: ThemeSelectionCardProps) => {
  const [showThemeSidepanel, setShowThemeSidepanel] = React.useState(false);
  const selectedTheme = NAMED_THEMES.find(theme => theme.id === getPresetId(themeVars, true));
  const hasThemeOverrides = Object.keys(themeVars).some(
    key => key !== '__preset' && key !== '__assetPreset'
  );
  const lightAccent = appliedTheme(themeVars, 'light', true)[ACCENT_PRIMARY_KEY];
  const darkAccent = appliedTheme(themeVars, 'dark', true)[ACCENT_PRIMARY_KEY];

  return (
    <>
      <div className="sm:col-span-2">
        <div
          className="rounded-xl border p-4"
          style={{
            borderColor: 'color-mix(in srgb, var(--color-theme-border-default) 60%, transparent)',
            backgroundColor: 'var(--color-theme-surface-muted)',
          }}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p
                className="text-sm font-medium"
                style={{ color: 'var(--color-theme-text-primary)' }}
              >
                <Translate>Theme and branding</Translate>
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span
                  className="rounded-full px-2.5 py-1 font-medium"
                  style={{
                    backgroundColor: 'var(--color-theme-surface-raised)',
                    color: 'var(--color-theme-text-secondary)',
                    boxShadow:
                      'inset 0 0 0 1px color-mix(in srgb, var(--color-theme-border-default) 70%, transparent)',
                  }}
                >
                  {selectedTheme?.label}
                </span>
                {hasThemeOverrides ? (
                  <span
                    className="rounded-full px-2.5 py-1 font-medium"
                    style={{
                      backgroundColor: 'var(--color-theme-feedback-info-tint)',
                      color: 'var(--color-theme-action-primary)',
                      boxShadow:
                        'inset 0 0 0 1px color-mix(in srgb, var(--color-theme-feedback-info) 35%, transparent)',
                    }}
                  >
                    <Translate>Customized</Translate>
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div
                className="overflow-hidden rounded-lg border"
                style={{
                  borderColor:
                    'color-mix(in srgb, var(--color-theme-border-default) 70%, transparent)',
                }}
              >
                <div className="flex">
                  <span className="h-8 w-12" style={{ backgroundColor: lightAccent }} />
                  <span className="h-8 w-12" style={{ backgroundColor: darkAccent }} />
                </div>
              </div>
              <Button type="button" variant="secondary" onClick={() => setShowThemeSidepanel(true)}>
                <Translate>Edit theme</Translate>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ThemeSettingsSidepanel
        isOpen={showThemeSidepanel}
        onClose={() => setShowThemeSidepanel(false)}
        themeVars={themeVars}
        onThemeChange={onThemeChange}
        themeAssets={themeAssets}
        onThemeAssetsChange={onThemeAssetsChange}
        siteLogo={siteLogo}
        favicon={favicon}
        customUploadFiles={customUploadFiles}
      />
    </>
  );
};

export { ThemeSelectionCard };
