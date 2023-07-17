/* eslint-disable react/jsx-props-no-spreading */
import React, { useState } from 'react';
import { IncomingHttpHeaders } from 'http';
import { useLoaderData, LoaderFunction } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { intersectionBy, keyBy, merge, values } from 'lodash';
import { Row, createColumnHelper } from '@tanstack/react-table';
import { Translate, I18NApi } from 'app/I18N';
import { RequestParams } from 'app/utils/RequestParams';
import { settingsAtom } from 'app/V2/atoms/settingsAtom';
import { Button, Table, ConfirmationModal } from 'V2/Components/UI';
import { useApiCaller } from 'V2/CustomHooks/useApiCaller';
import { SettingsContent } from 'app/V2/Components/Layouts/SettingsContent';
import { LanguageSchema } from 'shared/types/commonTypes';
import { Settings } from 'shared/types/settingsType';
import { InstallLanguagesModal } from './components/InstallLanguagesModal';
import {
  DefaultHeader,
  LabelHeader,
  ResetHeader,
  UninstallHeader,
  DefaultButton,
  ResetButton,
  UninstallButton,
  LanguageLabel,
} from './components/TableComponents';

const languagesListLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async () =>
    I18NApi.getLanguages(new RequestParams({}, headers));
// eslint-disable-next-line max-statements
const LanguagesList = () => {
  const { languages: collectionLanguages = [] } = useRecoilValue<Settings>(settingsAtom);
  const { requestAction } = useApiCaller();
  const [modalProps, setModalProps] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  const availableLanguages = useLoaderData() as LanguageSchema[];
  const installedLanguages = intersectionBy(availableLanguages, collectionLanguages, 'key');
  const notInstalledLanguages = availableLanguages.filter(
    l => !collectionLanguages.find(cl => cl.key === l.key)
  );
  const languages = values(
    merge(keyBy(installedLanguages, 'key'), keyBy(collectionLanguages, 'key'))
  );

  const handleAction =
    (
      successMessage: React.ReactNode,
      action: { (requestParams: RequestParams): Promise<Response> },
      key: string,
      currentLanguage?: LanguageSchema
    ) =>
    async () => {
      setShowModal(false);
      if (currentLanguage) {
        await requestAction(
          action,
          new RequestParams({ [key]: currentLanguage.key }),
          successMessage
        );
      }
    };

  const confirmAction = (
    message: string,
    acceptLabel: string,
    handleAcceptedAction: () => void
  ) => {
    setModalProps({
      header: 'Are you sure?',
      body: message,
      acceptButton: acceptLabel,
      cancelButton: 'No, cancel',
      warningText: 'Other users will be affected by this action!',
      confirmWord: 'CONFIRM',
      onAcceptClick: handleAcceptedAction,
      onCancelClick: () => setShowModal(false),
      size: 'md',
    });
    setShowModal(true);
  };

  const resetModal = (row: Row<LanguageSchema>) => {
    confirmAction(
      'You are about to reset a language.',
      'Reset',
      handleAction(
        <Translate>Language reset success</Translate>,
        I18NApi.populateTranslations,
        'locale',
        row.original as LanguageSchema
      )
    );
  };

  const setDefaultLanguage = async (row: Row<LanguageSchema>) => {
    await handleAction(
      <Translate>Default language change success</Translate>,
      I18NApi.setDefaultLanguage,
      'key',
      row.original as LanguageSchema
    )();
  };

  const uninstallModal = (row: Row<LanguageSchema>) => {
    confirmAction(
      'You are about to uninstall a language.',
      'Uninstall',
      handleAction(
        <Translate>Language uninstalled success</Translate>,
        I18NApi.deleteLanguage,
        'key',
        row.original as LanguageSchema
      )
    );
  };
  const columnHelper = createColumnHelper<LanguageSchema>();
  const columns = [
    columnHelper.accessor('label', {
      id: 'label',
      header: LabelHeader,
      cell: LanguageLabel,
      meta: { headerClassName: 'w-9/12' },
    }),
    columnHelper.accessor('default', {
      header: DefaultHeader,
      cell: DefaultButton,
      enableSorting: false,
      meta: { action: setDefaultLanguage, headerClassName: 'text-center w-1/12' },
    }),
    columnHelper.accessor('key', {
      header: ResetHeader,
      cell: ResetButton,
      enableSorting: false,
      meta: { action: resetModal, headerClassName: 'text-center w-1/12' },
    }),
    columnHelper.accessor('_id', {
      header: UninstallHeader,
      cell: UninstallButton,
      enableSorting: false,
      meta: { action: uninstallModal, headerClassName: 'text-center w-1/12' },
    }),
  ];

  return (
    <div
      className="tw-content"
      style={{ width: '100%', overflowY: 'auto' }}
      data-testid="settings-languages"
    >
      <SettingsContent>
        <SettingsContent.Header title="Languages" />
        <SettingsContent.Body>
          <div data-testid="languages">
            <Table<LanguageSchema>
              columns={columns}
              data={languages}
              title={<Translate>Active languages</Translate>}
              initialState={{ sorting: [{ id: 'label', desc: false }] }}
            />
          </div>
        </SettingsContent.Body>
        <SettingsContent.Footer>
          <div className="flex gap-2 p-2 pt-1">
            <Button
              onClick={() => {
                setShowInstallModal(true);
              }}
            >
              <Translate>Install Language(s)</Translate>
            </Button>
          </div>
        </SettingsContent.Footer>
      </SettingsContent>
      {showModal && (
        <div className="container w-10 h-10">
          <ConfirmationModal {...modalProps} size="md" />
        </div>
      )}
      {showInstallModal && (
        <InstallLanguagesModal
          setShowModal={setShowInstallModal}
          languages={notInstalledLanguages}
        />
      )}
    </div>
  );
};

export { LanguagesList, languagesListLoader };
