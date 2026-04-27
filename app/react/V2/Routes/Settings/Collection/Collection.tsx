/* eslint-disable max-lines */
/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { IncomingHttpHeaders } from 'http';
import { LoaderFunction, useLoaderData, useRevalidator } from 'react-router';
import { useForm } from 'react-hook-form';
import isUndefined from 'lodash/isUndefined.js';
import { QuestionMarkCircleIcon } from '@heroicons/react/20/solid';
import { useSetAtom } from 'jotai';
import * as FilesAPI from '#V2/api/files/index.js';
import * as SettingsAPI from '#V2/api/settings/index.js';
import * as TemplatesAPI from '#V2/api/templates/index.js';
import { InputField, Select, MultiSelect, Geolocation } from '#V2/Components/Forms/index.js';
import { Button, Card, Tooltip } from '#V2/Components/UI/index.js';
import { settingsAtom } from '#V2/atoms/settingsAtom.js';
import { SettingsContent } from '#V2/Components/Layouts/SettingsContent.js';
import { Translate, t } from '#app/I18N/index.js';
import { ClientSettings, Template } from '#app/apiResponseTypes.js';
import { FetchResponseError } from '#shared/JSONRequest.js';
import * as tips from './collectionSettingsTips.js';
import { CollectionOptionToggle } from './CollectionOptionToggle.js';
import { CustomUploadImagePicker } from './Theming/CustomUploadImagePicker.js';
import { FileType } from '#shared/types/fileType.js';
import { ThemeSettingsSidepanel } from './Theming/ThemeSettingsSidepanel.js';
import { ACCENT_PRIMARY_KEY, appliedTheme, getPresetId, NAMED_THEMES } from '#V2/theme/themes.js';
import { useRequestStatus } from '#V2/atoms/requestStatusAtom.js';
import { faviconImageSizeRule } from './Theming/brandImageUploadRules.js';

type SettingsWithThemeFlag = ClientSettings & { themeCustomization?: boolean };

const collectionLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async () => {
    const raw = await SettingsAPI.get(headers);
    const { themeCustomization: themeCustomizationFlag, ...settings } =
      raw as SettingsWithThemeFlag;
    const [templates, customFilesRaw] = await Promise.all([
      TemplatesAPI.get(headers),
      FilesAPI.getByType('custom', headers),
    ]);
    const customUploadFiles = Array.isArray(customFilesRaw) ? customFilesRaw : [];
    return {
      settings,
      templates,
      themeCustomization: themeCustomizationFlag ?? false,
      customUploadFiles,
    };
  };

const dateOptions = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  const yearLabel = t('System', 'Year', null, false);
  const monthLabel = t('System', 'Month', null, false);
  const dayLabel = t('System', 'Day', null, false);

  return [
    {
      value: 'yyyy/MM/dd',
      label: `${year}/${month}/${day} (${yearLabel}/${monthLabel}/${dayLabel})`,
    },
    {
      value: 'dd/MM/yyyy',
      label: `${day}/${month}/${year} (${dayLabel}/${monthLabel}/${yearLabel})`,
    },
    {
      value: 'MM/dd/yyyy',
      label: `${month}/${day}/${year} (${monthLabel}/${dayLabel}/${yearLabel})`,
    },
    {
      value: 'yyyy-MM-dd',
      label: `${year}-${month}-${day} (${yearLabel}-${monthLabel}-${dayLabel})`,
    },
    {
      value: 'dd-MM-yyyy',
      label: `${day}-${month}-${year} (${dayLabel}-${monthLabel}-${yearLabel})`,
    },
    {
      value: 'MM-dd-yyyy',
      label: `${month}-${day}-${year} (${monthLabel}-${dayLabel}-${yearLabel})`,
    },
  ];
};

const Collection = () => {
  const { settings, templates, themeCustomization, customUploadFiles } = useLoaderData() as {
    settings: ClientSettings;
    templates: Template[];
    themeCustomization: boolean;
    customUploadFiles: FileType[];
  };
  const { links, custom, ...formData } = settings;
  const [showThemeSidepanel, setShowThemeSidepanel] = React.useState(false);

  const { notify } = useRequestStatus();
  const setSettings = useSetAtom(settingsAtom);
  const revalidator = useRevalidator();
  formData.private = !formData.private;
  const {
    register,
    setValue,
    watch,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<ClientSettings>({
    defaultValues: {
      ...formData,
      themeAssets: formData.themeAssets ?? {},
      themeVars: formData.themeVars ?? {},
    },
    mode: 'onSubmit',
  });

  const submit = async (data: ClientSettings) => {
    if (!isUndefined(data.newNameGeneration) && !data.newNameGeneration) {
      delete data.newNameGeneration;
    }
    if (themeCustomization) {
      const lightLogo = data.themeAssets?.siteLogo?.light?.trim();
      const lightFavicon = data.themeAssets?.favicon?.light?.trim();
      if (lightLogo) data.site_logo = lightLogo;
      if (lightFavicon) data.favicon = lightFavicon;
    }
    data.private = !data.private;
    const { themeCustomization: _, ...rest } = data as SettingsWithThemeFlag;
    const response = await SettingsAPI.save(rest);
    if (response instanceof FetchResponseError) {
      notify(
        'error',
        t('System', 'An error occurred', null, false),
        undefined,
        response.message || undefined
      );
    } else {
      setSettings(response);
      notify('success', t('System', 'Settings updated', null, false));
    }
    await revalidator.revalidate();
  };

  const labelWithTip = (label: React.ReactNode, tip: React.ReactNode) => (
    <span className="flex gap-4">
      {label}
      <Tooltip content={tip} placement="right">
        <QuestionMarkCircleIcon className="h-5 w-5 [color:var(--color-theme-text-muted)]" />
      </Tooltip>
    </span>
  );

  const templateOptions = templates.map(template => ({
    label: template.name,
    value: template._id,
  }));

  const mapLayersOptions = [
    { label: t('System', 'Dark', null, false), value: 'Dark' },
    {
      label: t('System', 'Streets', null, false),
      value: 'Streets',
    },
    {
      label: t('System', 'Satellite', null, false),
      value: 'Satellite',
    },
    {
      label: t('System', 'Hybrid', null, false),
      value: 'Hybrid',
    },
  ];

  const watchedThemeVars = watch('themeVars') ?? {};
  const selectedTheme = NAMED_THEMES.find(
    theme => theme.id === getPresetId(watchedThemeVars, true)
  );
  const hasThemeOverrides = Object.keys(watchedThemeVars).some(
    key => key !== '__preset' && key !== '__assetPreset'
  );
  const lightAccent = appliedTheme(watchedThemeVars, 'light', true)[ACCENT_PRIMARY_KEY];
  const darkAccent = appliedTheme(watchedThemeVars, 'dark', true)[ACCENT_PRIMARY_KEY];

  return (
    <div className="w-full h-full" data-testid="settings-collection">
      <SettingsContent>
        <SettingsContent.Header title="Collection" />
        <SettingsContent.Body>
          <form onSubmit={handleSubmit(submit)} id="collection-form">
            <Card className="mb-4" title={<Translate>General</Translate>}>
              <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
                <div className="sm:col-span-1">
                  <InputField
                    id="collection-name"
                    hasErrors={!!errors.site_name}
                    label={<Translate>Collection Name</Translate>}
                    {...register('site_name', { required: true })}
                  />
                </div>
                {!themeCustomization ? (
                  <CustomUploadImagePicker
                    id="favicon"
                    label={labelWithTip(<Translate>Custom Favicon</Translate>, tips.customFavIcon)}
                    registerProps={register('favicon')}
                    value={watch('favicon')}
                    onChange={v => setValue('favicon', v, { shouldDirty: true })}
                    files={customUploadFiles}
                    selectButtonTitle={<Translate>Select favicon image</Translate>}
                    recommendedSize="16x16 to 512x512 px (square)"
                    sizeRule={faviconImageSizeRule}
                    previewWrapperClassName="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded border p-2 [background-color:var(--color-theme-surface-warm)] [border-color:color-mix(in_srgb,var(--color-theme-border-default)_70%,transparent)]"
                  />
                ) : null}
                {themeCustomization && (
                  <>
                    <div className="sm:col-span-2">
                      <div
                        className="rounded-xl p-4"
                        style={{
                          border:
                            '1px solid color-mix(in srgb, var(--color-theme-border-default) 60%, transparent)',
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
                              className="overflow-hidden rounded-lg"
                              style={{
                                border:
                                  '1px solid color-mix(in srgb, var(--color-theme-border-default) 70%, transparent)',
                              }}
                            >
                              <div className="flex">
                                <span
                                  className="h-8 w-12"
                                  style={{ backgroundColor: lightAccent }}
                                />
                                <span
                                  className="h-8 w-12"
                                  style={{ backgroundColor: darkAccent }}
                                />
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => setShowThemeSidepanel(true)}
                            >
                              <Translate>Edit theme</Translate>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <ThemeSettingsSidepanel
                      isOpen={showThemeSidepanel}
                      onClose={() => setShowThemeSidepanel(false)}
                      themeVars={watchedThemeVars}
                      onThemeChange={v => setValue('themeVars', v, { shouldDirty: true })}
                      themeAssets={watch('themeAssets') ?? {}}
                      onThemeAssetsChange={v => setValue('themeAssets', v, { shouldDirty: true })}
                      siteLogo={watch('site_logo')}
                      favicon={watch('favicon')}
                      customUploadFiles={customUploadFiles}
                    />
                  </>
                )}
                <div className="sm:col-span-1">
                  <Select
                    label={<Translate>Default View</Translate>}
                    id="roles"
                    options={[
                      { label: t('System', 'Cards', null, false), value: 'cards' },
                      { label: t('System', 'Map', null, false), value: 'map' },
                      { label: t('System', 'Table', null, false), value: 'table' },
                    ]}
                    {...register('defaultLibraryView')}
                  />
                </div>
                <div className="sm:col-span-1">
                  <Select
                    label={<Translate>Default date format</Translate>}
                    id="date-format"
                    options={dateOptions()}
                    {...register('dateFormat')}
                  />
                </div>
                <div className="sm:col-span-2">
                  <InputField
                    id="landing-page"
                    preText="https://yourdomain"
                    label={labelWithTip(
                      <Translate>Custom landing page</Translate>,
                      tips.landingPageTip
                    )}
                    {...register('home_page')}
                  />
                </div>
                <CollectionOptionToggle
                  valueKey="private"
                  label="Public instance"
                  tip={tips.publicSharing}
                  register={register}
                  defaultChecked={formData.private}
                />
                <CollectionOptionToggle
                  valueKey="cookiepolicy"
                  label="Show cookie policy"
                  tip={tips.cookiePolicy}
                  register={register}
                  defaultChecked={formData.cookiepolicy}
                />
                <CollectionOptionToggle
                  valueKey="allowcustomJS"
                  label="Global JS"
                  tip={tips.globalJS}
                  register={register}
                  defaultChecked={formData.allowcustomJS}
                />
                {!settings.newNameGeneration && (
                  <CollectionOptionToggle
                    valueKey="newNameGeneration"
                    label="Non-latin characters support"
                    tip={tips.characterSupport}
                    register={register}
                    defaultChecked={formData.newNameGeneration}
                  />
                )}
              </div>
            </Card>
            <Card
              className="mb-4"
              title={
                <span className="flex gap-4">
                  <Translate>Analytics</Translate>
                  <Tooltip content={tips.analytics} placement="right">
                    <QuestionMarkCircleIcon className="h-5 w-5 [color:var(--color-theme-text-muted)]" />
                  </Tooltip>
                </span>
              }
            >
              <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
                <div className="sm:col-span-1">
                  <InputField
                    id="google-analytics"
                    label={<Translate>Google</Translate>}
                    {...register('analyticsTrackingId')}
                  />
                </div>
                <div className="sm:col-span-1">
                  <InputField
                    id="matomo-analytics"
                    label={<Translate>Matomo</Translate>}
                    {...register('matomoConfig')}
                  />
                </div>
              </div>
            </Card>
            {settings.features?.ocr?.url && (
              <Card className="mb-4" title={<Translate>Services</Translate>}>
                <CollectionOptionToggle
                  valueKey="ocrServiceEnabled"
                  label="Document OCR trigger"
                  tip={tips.ocrTrigger}
                  register={register}
                  defaultChecked={formData.ocrServiceEnabled}
                />
              </Card>
            )}
            <Card className="mb-4" title={<Translate>Forms and email configuration</Translate>}>
              <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
                <div className="sm:col-span-1">
                  <InputField
                    id="sending-email"
                    label={labelWithTip(<Translate>Sending email</Translate>, tips.emails[1])}
                    {...register('senderEmail')}
                  />
                </div>
                <div className="sm:col-span-1">
                  <InputField
                    id="receiving-email"
                    label={labelWithTip(
                      <Translate>Contact form email</Translate>,
                      tips.receivingEmail
                    )}
                    {...register('contactEmail')}
                  />
                </div>
                <div className="sm:col-span-2">
                  <InputField
                    id="public-form-destination"
                    label={labelWithTip(
                      <Translate>Public Form submit URL</Translate>,
                      tips.publicForm[1]
                    )}
                    {...register('publicFormDestination')}
                  />
                </div>
                <CollectionOptionToggle
                  valueKey="openPublicEndpoint"
                  label="Allow captcha bypass"
                  tip={tips.openPublicForm}
                  register={register}
                  defaultChecked={formData.openPublicEndpoint}
                />
                <div className="sm:col-span-2">
                  <MultiSelect
                    label={labelWithTip(
                      <Translate>Whitelisted templates</Translate>,
                      tips.publicForm[2]
                    )}
                    options={templateOptions}
                    onChange={(newValues: any) => {
                      setValue('allowedPublicTemplates', newValues);
                    }}
                    value={settings.allowedPublicTemplates || []}
                  />
                </div>
              </div>
            </Card>
            <Card className="mb-4" title={<Translate>Map</Translate>}>
              <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
                <div className="sm:col-span-1">
                  <Select
                    label={<Translate>Map Provider</Translate>}
                    id="roles"
                    options={[
                      { label: t('System', 'Mapbox', null, false), value: 'mapbox' },
                      { label: t('System', 'Google', null, false), value: 'google' },
                    ]}
                    {...register('tilesProvider')}
                  />
                </div>
                <div className="sm:col-span-1">
                  <InputField
                    id="map-key"
                    label={labelWithTip(<Translate>Map API key</Translate>, tips.mapApiKey)}
                    {...register('mapApiKey', { pattern: /^[a-zA-Z0-9._]+$/ })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <MultiSelect
                    label={labelWithTip(<Translate>Map Layers</Translate>, tips.mapLayers)}
                    options={mapLayersOptions}
                    hasErrors={!!errors.mapLayers}
                    canBeEmpty={false}
                    value={settings.mapLayers?.length ? settings.mapLayers : ['Streets']}
                    onChange={(newValues: any) => {
                      clearErrors('mapLayers');
                      if (!newValues.length) {
                        setError(
                          'mapLayers',
                          { type: 'custom', message: 'Map layers cannot be empty' },
                          { shouldFocus: true }
                        );
                        return;
                      }
                      //@ts-ignore
                      setValue('mapLayers', newValues);
                    }}
                  />
                </div>
                <div className="col-span-2">
                  <Geolocation
                    value={watch('mapStartingPoint')?.[0] ?? {}}
                    onChange={({ lat, lon }: { lat?: number; lon?: number }) => {
                      if (lat && lon) {
                        setValue('mapStartingPoint', [{ lat, lon }]);
                        return;
                      }
                      setValue('mapStartingPoint', []);
                    }}
                    name="mapStartingPoint"
                  />
                </div>
              </div>
            </Card>
          </form>
        </SettingsContent.Body>
        <SettingsContent.Footer>
          <div className="flex gap-2">
            <Button type="submit" form="collection-form">
              <Translate>Save</Translate>
            </Button>
          </div>
        </SettingsContent.Footer>
      </SettingsContent>
    </div>
  );
};

export { Collection, collectionLoader };
