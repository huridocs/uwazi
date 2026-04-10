import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { ThemeSelector } from '#V2/Components/ThemeSelector/index.js';
import { Button, Sidepanel } from '#V2/Components/UI/index.js';
import { FileType } from '#shared/types/fileType.js';
import type { ThemeAssets, ThemeMode } from '#V2/theme/themes.js';
import { CustomUploadImagePicker } from './CustomUploadImagePicker.js';

type ThemeSettingsSidepanelProps = {
  isOpen: boolean;
  onClose: () => void;
  themeVars: Record<string, string | undefined>;
  onThemeChange: (value: Record<string, string | undefined>) => void;
  themeAssets?: ThemeAssets;
  onThemeAssetsChange: (value: ThemeAssets) => void;
  siteLogo: string | undefined;
  favicon: string | undefined;
  customUploadFiles: FileType[];
};

const modeTitle: Record<ThemeMode, React.ReactNode> = {
  light: <Translate>Light Theme</Translate>,
  dark: <Translate>Dark Theme</Translate>,
};

const ThemeSettingsSidepanel = ({
  isOpen,
  onClose,
  themeVars,
  onThemeChange,
  themeAssets,
  onThemeAssetsChange,
  siteLogo,
  favicon,
  customUploadFiles,
}: ThemeSettingsSidepanelProps) => (
  <Sidepanel
    isOpen={isOpen}
    withOverlay
    size="large"
    closeSidepanelFunction={onClose}
    title={<Translate>Theme and branding</Translate>}
  >
    <div className="flex h-full flex-col">
      <Sidepanel.Body>
        <div className="space-y-6">
          <ThemeSelector
            value={themeVars}
            onChange={onThemeChange}
            themeAssets={themeAssets}
            onThemeAssetsChange={onThemeAssetsChange}
            siteLogo={siteLogo}
            favicon={favicon}
          />

          <div className="rounded-xl border border-gray-200 p-4">
            <div className="space-y-6">
              <div>
                <p className="text-sm font-medium text-gray-800">
                  <Translate>Theme logotype</Translate>
                </p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {(['light', 'dark'] as const).map(mode => (
                    <div key={`siteLogo-${mode}`} className="rounded-xl border border-gray-200 p-3">
                      <CustomUploadImagePicker
                        id={`theme-assets-siteLogo-${mode}`}
                        label={modeTitle[mode]}
                        value={themeAssets?.siteLogo?.[mode] ?? ''}
                        onChange={url =>
                          onThemeAssetsChange({
                            ...themeAssets,
                            siteLogo: {
                              ...themeAssets?.siteLogo,
                              [mode]: url || undefined,
                            },
                          })
                        }
                        files={customUploadFiles}
                        selectButtonTitle={<Translate>Select site logo image</Translate>}
                        recommendedSize="200x32 px"
                        previewWrapperClassName="flex h-14 w-32 shrink-0 items-center justify-center overflow-hidden rounded border border-gray-200 bg-gray-50 p-2"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <p className="text-sm font-medium text-gray-800">
                  <Translate>Theme favicon</Translate>
                </p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {(['light', 'dark'] as const).map(mode => (
                    <div key={`favicon-${mode}`} className="rounded-xl border border-gray-200 p-3">
                      <CustomUploadImagePicker
                        id={`theme-assets-favicon-${mode}`}
                        label={modeTitle[mode]}
                        value={themeAssets?.favicon?.[mode] ?? ''}
                        onChange={url =>
                          onThemeAssetsChange({
                            ...themeAssets,
                            favicon: {
                              ...themeAssets?.favicon,
                              [mode]: url || undefined,
                            },
                          })
                        }
                        files={customUploadFiles}
                        selectButtonTitle={<Translate>Select favicon image</Translate>}
                        recommendedSize="64x64 px"
                        previewWrapperClassName="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded border border-gray-200 bg-gray-50 p-2"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Sidepanel.Body>

      <Sidepanel.Footer className="border-t border-gray-200 px-4 py-3">
        <div className="flex justify-end">
          <Button type="button" onClick={onClose}>
            <Translate>Done</Translate>
          </Button>
        </div>
      </Sidepanel.Footer>
    </div>
  </Sidepanel>
);

export { ThemeSettingsSidepanel };
