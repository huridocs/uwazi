/* eslint-disable camelcase */
/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { IncomingHttpHeaders } from 'http';
import { RequestParams } from 'app/utils/RequestParams';
import SettingsAPI from 'app/Settings/SettingsAPI';

import { LoaderFunction, useLoaderData, useRevalidator } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useSetRecoilState } from 'recoil';
import { notificationAtom } from 'app/V2/atoms';

import { InputField, Select } from 'app/V2/Components/Forms';
import { Button, Card } from 'app/V2/Components/UI';
import { SettingsContent } from 'app/V2/Components/Layouts/SettingsContent';
import { Translate } from 'app/I18N';
import { ClientSettings } from 'app/apiResponseTypes';
import { EnableButton } from 'app/V2/Components/UI';

const collectionLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async () =>
    SettingsAPI.get(new RequestParams({}, headers));

const dateOptions = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return [
    { value: 'yyyy/MM/dd', key: `${year}/${month}/${day}` },
    { value: 'dd/MM/yyyy', key: `${day}/${month}/${year}` },
    { value: 'MM/dd/yyyy', key: `${month}/${day}/${year}` },
    { value: 'yyyy-MM-dd', key: `${year}-${month}-${day}` },
    { value: 'dd-MM-yyyy', key: `${day}-${month}-${year}` },
    { value: 'MM-dd-yyyy', key: `${month}-${day}-${year}` },
  ];
};

const Collection = () => {
  const settings = useLoaderData() as ClientSettings;
  const { links, custom, ...formData } = settings;
  const setNotifications = useSetRecoilState(notificationAtom);
  const revalidator = useRevalidator();
  const {
    register,
    watch,
    handleSubmit,
    formState: { errors, isSubmitted },
  } = useForm<ClientSettings>({
    defaultValues: formData,
    mode: 'onSubmit',
  });

  const submit = async (data: ClientSettings) => {
    await SettingsAPI.save(new RequestParams(data));
    await revalidator.revalidate();
    setNotifications({
      type: 'success',
      text: <Translate>Settings updated</Translate>,
    });
  };

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
              <div className="grid gap-4 mb-4 sm:grid-cols-2 sm:gap-6">
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
                    type="file"
                    hasErrors={!!errors.site_name}
                    label={<Translate>Custom Favicon</Translate>}
                    {...register('favicon')}
                  />
                </div>
              </div>
              <div className="grid gap-4 mb-4 sm:grid-cols-2 sm:gap-6">
                <div className="sm:col-span-1">
                  <Select
                    label={<Translate>Default View</Translate>}
                    className="mb-4"
                    id="roles"
                    options={[
                      { key: 'map', value: 'map' },
                      { key: 'cards', value: 'cards' },
                      { key: 'table', value: 'table' },
                    ]}
                    {...register('defaultLibraryView')}
                  />
                </div>
                <div className="sm:col-span-1">
                  <Select
                    label={<Translate>Default date format</Translate>}
                    className="mb-4"
                    id="roles"
                    options={dateOptions()}
                    {...register('dateFormat')}
                  />
                </div>
                <div className="">
                  <EnableButton {...register('private')} className="mr-4" />
                  <Translate className="block mb-2 text-sm font-medium text-gray-700">
                    Public instance
                  </Translate>
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
