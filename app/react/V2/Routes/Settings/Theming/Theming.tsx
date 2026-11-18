import React, { useState } from 'react';
import { IncomingHttpHeaders } from 'http';
import { LoaderFunction, useLoaderData, useRevalidator } from 'react-router';
import { useSetAtom } from 'jotai';
import * as FilesAPI from '#V2/api/files/index.js';
import * as SettingsAPI from '#V2/api/settings/index.js';
import { Button, SurfacePanel } from '#V2/Components/UI/index.js';
import { SettingsContent } from '#V2/Components/Layouts/SettingsContent.js';
import { ThemeSelector } from '#V2/Components/ThemeSelector/index.js';
import { mergeClientSettings } from '#V2/atoms/mergeClientSettings.js';
import { settingsAtom } from '#V2/atoms/settingsAtom.js';
import { useRequestStatus } from '#V2/atoms/requestStatusAtom.js';
import { Translate, t } from '#app/I18N/index.js';
import { previewThemeCustomization } from '#app/utils/v2Preview.js';
import { isClient } from '#app/utils/index.js';
import { getStore } from '#shared/atomStore/index.js';
import { ClientSettings } from '#app/apiResponseTypes.js';
import { FileType } from '#shared/types/fileType.js';
import type { ThemeAssets, ThemeMode } from '#V2/theme/themes.js';
import { CustomUploadImagePicker } from '../Collection/Theming/CustomUploadImagePicker.js';
import {
  faviconImageSizeRule,
  themeLogotypeImageSizeRule,
} from '../Collection/Theming/brandImageUploadRules.js';
import { buildThemeSavePayload, savedThemeFields } from '../Collection/Theming/themeSavePayload.js';

type SettingsWithThemeFlag = ClientSettings & { themeCustomization?: boolean };

const modeTitle: Record<ThemeMode, React.ReactNode> = {
  light: <Translate>Light Theme</Translate>,
  dark: <Translate>Dark Theme</Translate>,
};

const assetPreviewWrapperClassName =
  'flex shrink-0 items-center justify-center overflow-hidden rounded border p-2 bg-[color-mix(in_srgb,var(--color-theme-surface-warm)_70%,var(--color-theme-text-primary))] [background-image:linear-gradient(45deg,color-mix(in_srgb,var(--color-theme-text-primary)_28%,transparent)_25%,transparent_25%,transparent_75%,color-mix(in_srgb,var(--color-theme-text-primary)_28%,transparent)_75%,color-mix(in_srgb,var(--color-theme-text-primary)_28%,transparent)),linear-gradient(45deg,color-mix(in_srgb,var(--color-theme-surface-muted)_88%,transparent)_25%,transparent_25%,transparent_75%,color-mix(in_srgb,var(--color-theme-surface-muted)_88%,transparent)_75%,color-mix(in_srgb,var(--color-theme-surface-muted)_88%,transparent))] [background-size:8px_8px] [background-position:0_0,4px_4px] border-[color-mix(in_srgb,var(--color-theme-text-primary)_30%,var(--color-theme-border-default))]';

const themingLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async ({ request }) => {
    const [raw] = await SettingsAPI.get(headers);
    const { themeCustomization: themeCustomizationFlag, ...settings } = (raw ??
      {}) as SettingsWithThemeFlag;
    const headerCookie = typeof headers?.cookie === 'string' ? headers.cookie : undefined;
    const cookieHeader = headerCookie ?? request.headers.get('cookie') ?? undefined;
    const hydratedPreview =
      isClient &&
      !cookieHeader &&
      !themeCustomizationFlag &&
      Boolean(getStore().get(settingsAtom).themeCustomization)
        ? 'uwazi_v2_preview=1'
        : undefined;
    const customFilesRaw = await FilesAPI.getByType('custom', headers);
    return {
      settings,
      themeCustomization: previewThemeCustomization(themeCustomizationFlag, {
        search: new URL(request.url).search,
        cookieHeader: cookieHeader ?? hydratedPreview,
      }),
      customUploadFiles: Array.isArray(customFilesRaw) ? customFilesRaw : [],
    };
  };

const applyThemeResponse = ({
  response,
  setSettings,
  setThemeVars,
  setThemeAssets,
}: {
  response: ClientSettings | undefined;
  setSettings: (update: (prev: ClientSettings) => ClientSettings) => void;
  setThemeVars: (value: Record<string, string | undefined>) => void;
  setThemeAssets: (value: ThemeAssets) => void;
}) => {
  setSettings(prev => mergeClientSettings(prev, response));
  if (!response) return;
  const saved = savedThemeFields(response);
  setThemeVars(saved.themeVars);
  setThemeAssets(saved.themeAssets);
};

const persistTheme = async ({
  themeVars,
  themeAssets,
  notify,
  setSettings,
  setThemeVars,
  setThemeAssets,
  revalidate,
}: {
  themeVars: Record<string, string | undefined>;
  themeAssets: ThemeAssets;
  notify: ReturnType<typeof useRequestStatus>['notify'];
  setSettings: (update: (prev: ClientSettings) => ClientSettings) => void;
  setThemeVars: (value: Record<string, string | undefined>) => void;
  setThemeAssets: (value: ThemeAssets) => void;
  revalidate: () => Promise<void>;
}) => {
  const [response, error] = await SettingsAPI.save(buildThemeSavePayload(themeVars, themeAssets));
  if (error) {
    notify(
      'error',
      t('System', 'An error occurred', null, false),
      undefined,
      error.message || undefined
    );
    return;
  }
  applyThemeResponse({ response, setSettings, setThemeVars, setThemeAssets });
  notify('success', t('System', 'Settings updated', null, false));
  await revalidate();
};

const Theming = () => {
  const { settings, customUploadFiles } = useLoaderData() as {
    settings: ClientSettings;
    customUploadFiles: FileType[];
  };
  const { notify } = useRequestStatus();
  const setSettings = useSetAtom(settingsAtom);
  const revalidator = useRevalidator();
  const [saving, setSaving] = useState(false);
  const [themeVars, setThemeVars] = useState<Record<string, string | undefined>>(
    settings.themeVars ?? {}
  );
  const [themeAssets, setThemeAssets] = useState<ThemeAssets>(settings.themeAssets ?? {});

  const save = async () => {
    setSaving(true);
    await persistTheme({
      themeVars,
      themeAssets,
      notify,
      setSettings,
      setThemeVars,
      setThemeAssets,
      revalidate: async () => {
        await revalidator.revalidate();
      },
    });
    setSaving(false);
  };

  return (
    <div className="h-full w-full" data-testid="settings-theming">
      <SettingsContent>
        <SettingsContent.Header title="Theme and branding" />
        <SettingsContent.Body>
          <div className="space-y-6 pb-4">
            <ThemeSelector
              value={themeVars}
              onChange={setThemeVars}
              themeAssets={themeAssets}
              onThemeAssetsChange={setThemeAssets}
              siteLogo={settings.site_logo}
              siteName={settings.site_name}
              favicon={settings.favicon}
              panelOpen
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {(['light', 'dark'] as const).map(mode => (
                  <SurfacePanel key={`siteLogo-${mode}`} padding="sm" className="shadow-none">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      <Translate>Theme logo</Translate>
                    </p>
                    <CustomUploadImagePicker
                      id={`theme-assets-siteLogo-${mode}`}
                      label={modeTitle[mode]}
                      value={themeAssets.siteLogo?.[mode] ?? ''}
                      onChange={url =>
                        setThemeAssets({
                          ...themeAssets,
                          siteLogo: { ...themeAssets.siteLogo, [mode]: url || undefined },
                        })
                      }
                      files={customUploadFiles}
                      selectButtonTitle={<Translate>Select site logo image</Translate>}
                      recommendedSize="48x16 to 800x256 px"
                      sizeRule={themeLogotypeImageSizeRule}
                      emptyGalleryHint={<Translate>Site logo no images hint</Translate>}
                      previewWrapperClassName={`${assetPreviewWrapperClassName} h-14 w-fit max-w-full`}
                      adjustable
                      projectHeaderLogo
                    />
                  </SurfacePanel>
                ))}
                {(['light', 'dark'] as const).map(mode => (
                  <SurfacePanel key={`favicon-${mode}`} padding="sm" className="shadow-none">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      <Translate>Theme favicon</Translate>
                    </p>
                    <CustomUploadImagePicker
                      id={`theme-assets-favicon-${mode}`}
                      label={modeTitle[mode]}
                      value={themeAssets.favicon?.[mode] ?? ''}
                      onChange={url =>
                        setThemeAssets({
                          ...themeAssets,
                          favicon: { ...themeAssets.favicon, [mode]: url || undefined },
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
            </ThemeSelector>
          </div>
        </SettingsContent.Body>
        <SettingsContent.Footer>
          <div className="flex justify-end">
            <Button type="button" variant="primary" disabled={saving} onClick={() => void save()}>
              <Translate>Save theme</Translate>
            </Button>
          </div>
        </SettingsContent.Footer>
      </SettingsContent>
    </div>
  );
};

export { Theming, themingLoader };
