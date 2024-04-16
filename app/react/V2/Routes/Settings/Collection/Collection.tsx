/* eslint-disable max-statements */
/* eslint-disable max-lines */
/* eslint-disable camelcase */
/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { IncomingHttpHeaders } from 'http';
import { LoaderFunction, useLoaderData, useRevalidator } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useSetAtom } from 'jotai';
import { isUndefined } from 'lodash';
import { Tooltip } from 'flowbite-react';
import * as SettingsAPI from 'V2/api/settings';
import * as TemplatesAPI from 'V2/api/templates';
import { notificationAtom } from 'app/V2/atoms';
import { InputField, Select, MultiSelect, Geolocation } from 'app/V2/Components/Forms';
import { Button, Card } from 'app/V2/Components/UI';
import { settingsAtom } from 'app/V2/atoms/settingsAtom';
import { SettingsContent } from 'app/V2/Components/Layouts/SettingsContent';
import { Translate, t } from 'app/I18N';
import { ClientSettings, Template } from 'app/apiResponseTypes';
import { QuestionMarkCircleIcon } from '@heroicons/react/20/solid';
import * as tips from './collectionSettingsTips';
import { CollectionOptionToggle } from './CollectionOptionToggle';

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
    await SettingsAPI.save(data);
    await revalidator.revalidate();
    setSettings(data);
    setNotifications({
      type: 'success',
      text: <Translate>Settings updated</Translate>,
    });
  };

  const labelWithTip = (label: string, tip: React.ReactNode) => (
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
    { label: 'Dark', value: 'Dark' },
    {
      label: 'Streets',
      value: 'Streets',
    },
    {
      label: 'Satellite',
      value: 'Satellite',
    },
    {
      label: 'Hybrid',
      value: 'Hybrid',
    },
  ];

  return (
    <div
      className="tw-content"
      style={{ width: '100%', overflowY: 'auto' }}
      data-testid="settings-collection"
    >
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
                      { label: 'Cards', value: 'cards' },
                      { label: 'Map', value: 'map' },
                      { label: 'Table', value: 'table' },
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
                    preText="eg. https://yourdomain"
                    label={labelWithTip('Custom landing page', tips.landingPageTip)}
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
                />
              </Card>
            )}
            <Card className="mb-4" title={<Translate>Forms and email configuration</Translate>}>
              <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
                <div className="sm:col-span-1">
                  <InputField
                    id="sending-email"
                    label={labelWithTip('Sending email', tips.emails[1])}
                    {...register('senderEmail')}
                  />
                </div>
                <div className="sm:col-span-1">
                  <InputField
                    id="receiving-email"
                    label={labelWithTip('Contact form email', tips.receivingEmail)}
                    {...register('contactEmail')}
                  />
                </div>
                <div className="sm:col-span-2">
                  <InputField
                    id="public-form-destination"
                    label={labelWithTip('Public Form submit URL', tips.publicForm[1])}
                    {...register('publicFormDestination')}
                  />
                </div>
                <CollectionOptionToggle
                  valueKey="openPublicEndpoint"
                  label="Allow captcha bypass"
                  tip={tips.openPublicForm}
                  register={register}
                />
                <div className="sm:col-span-2">
                  <MultiSelect
                    label={labelWithTip('Whitelisted templates', tips.publicForm[2])}
                    options={templateOptions}
                    onChange={newValues => {
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
                      { label: 'Mapbox', value: 'mapbox' },
                      { label: 'Google', value: 'google' },
                    ]}
                    {...register('tilesProvider')}
                  />
                </div>
                <div className="sm:col-span-1">
                  <InputField
                    id="map-key"
                    label={labelWithTip('Map API key', tips.mapApiKey)}
                    {...register('mapApiKey', { pattern: /^[a-zA-Z0-9._]+$/ })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <MultiSelect
                    label={labelWithTip('Map Layers', tips.mapLayers)}
                    options={mapLayersOptions}
                    hasErrors={!!errors.mapLayers}
                    canBeEmpty={false}
                    value={settings.mapLayers?.length ? settings.mapLayers : ['Streets']}
                    onChange={newValues => {
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
