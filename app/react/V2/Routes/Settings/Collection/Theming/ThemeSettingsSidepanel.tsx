import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { ThemeSelector } from '#V2/Components/ThemeSelector/index.js';
import { Button, SectionHeading, Sidepanel, SurfacePanel } from '#V2/Components/UI/index.js';
import { FileType } from '#shared/types/fileType.js';
import type { ThemeAssets, ThemeMode } from '#V2/theme/themes.js';
import { CustomUploadImagePicker } from './CustomUploadImagePicker.js';
import { faviconImageSizeRule, themeLogotypeImageSizeRule } from './brandImageUploadRules.js';

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

const assetPreviewWrapperClassName =
  'flex shrink-0 items-center justify-center overflow-hidden rounded border p-2 [background-color:var(--color-theme-surface-warm)] [border-color:color-mix(in_srgb,var(--color-theme-border-default)_70%,transparent)]';

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

          <SurfacePanel>
            <div className="space-y-6">
              <div>
                <SectionHeading>
                  <Translate>Theme logotype</Translate>
                </SectionHeading>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {(['light', 'dark'] as const).map(mode => (
                    <SurfacePanel key={`siteLogo-${mode}`} padding="sm" className="shadow-none">
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
                        recommendedSize="48x16 to 800x120 px"
                        sizeRule={themeLogotypeImageSizeRule}
                        emptyGalleryHint={<Translate>Site logo no images hint</Translate>}
                        previewWrapperClassName={`${assetPreviewWrapperClassName} h-14 w-32`}
                      />
                    </SurfacePanel>
                  ))}
                </div>
              </div>

              <div className="border-t [border-color:color-mix(in_srgb,var(--color-theme-border-default)_40%,transparent)] pt-6">
                <SectionHeading>
                  <Translate>Theme favicon</Translate>
                </SectionHeading>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {(['light', 'dark'] as const).map(mode => (
                    <SurfacePanel key={`favicon-${mode}`} padding="sm" className="shadow-none">
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
                        recommendedSize="16x16 to 512x512 px (square)"
                        sizeRule={faviconImageSizeRule}
                        emptyGalleryHint={<Translate>Favicon no images hint</Translate>}
                        previewWrapperClassName={`${assetPreviewWrapperClassName} h-14 w-14`}
                      />
                    </SurfacePanel>
                  ))}
                </div>
              </div>
            </div>
          </SurfacePanel>
        </div>
      </Sidepanel.Body>

      <Sidepanel.Footer className="border-t px-4 py-3 [border-color:color-mix(in_srgb,var(--color-theme-border-default)_40%,transparent)]">
        <div className="flex justify-end">
          <Button type="button" variant="primary" onClick={onClose}>
            <Translate>Done</Translate>
          </Button>
        </div>
      </Sidepanel.Footer>
    </div>
  </Sidepanel>
);

export { ThemeSettingsSidepanel };
