/* eslint-disable max-lines */
/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { IncomingHttpHeaders } from 'http';
import { LoaderFunction, useLoaderData, useRevalidator } from 'react-router';
import { useForm } from 'react-hook-form';
import { useSetAtom } from 'jotai';
import isUndefined from 'lodash/isUndefined.js';
import { Tooltip } from 'flowbite-react';
import { QuestionMarkCircleIcon } from '@heroicons/react/20/solid';
import * as SettingsAPI from '#V2/api/settings/index.js';
import * as TemplatesAPI from '#V2/api/templates/index.js';

import { notificationAtom } from '#V2/atoms/index.js';

import { InputField, Select, MultiSelect, Geolocation } from '#V2/Components/Forms/index.js';

import { Button, Card } from '#V2/Components/UI/index.js';

import { settingsAtom } from '#V2/atoms/settingsAtom.js';

import { SettingsContent } from '#V2/Components/Layouts/SettingsContent.jsx';

import { Translate, t } from '#app/I18N/index.js';

import { ClientSettings, Template } from '#app/apiResponseTypes.js';

import { FetchResponseError } from '#shared/JSONRequest.js';
import * as tips from '#V2/Routes/Settings/Collection/collectionSettingsTips.jsx';
import { CollectionOptionToggle } from '#V2/Routes/Settings/Collection/CollectionOptionToggle.jsx';

const collectionLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
    async () => {
      const settings = await SettingsAPI.get(headers);
      const templates = await TemplatesAPI.get(headers);
      return { settings, templates };
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
  const { settings, templates } = useLoaderData() as {
    settings: ClientSettings;
    templates: Template[];
  };
  const { links, custom, ...formData } = settings;

  const setNotifications = useSetAtom(notificationAtom);
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
    defaultValues: formData,
    mode: 'onSubmit',
  });

  const submit = async (data: ClientSettings) => {
    if (!isUndefined(data.newNameGeneration) && !data.newNameGeneration) {
      delete data.newNameGeneration;
    }
    data.private = !data.private;
    const response = await SettingsAPI.save(data);
    if (response instanceof FetchResponseError) {
      setNotifications({
        type: 'error',
        text: <Translate>An error occurred</Translate>,
        details: response.message || undefined,
      });
    } else {
      setSettings(response);
      setNotifications({
        type: 'success',
        text: <Translate>Settings updated</Translate>,
      });
    }
    await revalidator.revalidate();
  };

  const labelWithTip = (label: React.ReactNode, tip: React.ReactNode) => (
    <span className="flex gap-4">
      {label}
      <Tooltip
        // eslint-disable-next-line react/style-prop-object
        style="light"
        content={tip}
        placement="right"
      >
        <QuestionMarkCircleIcon className="w-5 h-5 text-gray-500" />
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

  return (
    <div className="w-full h-full overflow-y-auto" data-testid="settings-collection">
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
                <div className="sm:col-span-1">
                  <InputField
                    id="favicon"
                    type="text"
                    label={<Translate>Custom Favicon</Translate>}
                    {...register('favicon')}
                  />
                </div>
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
                  <Tooltip
                    // eslint-disable-next-line react/style-prop-object
                    style="light"
                    content={tips.analytics}
                    placement="right"
                  >
                    <QuestionMarkCircleIcon className="w-5 h-5 text-gray-500" />
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
