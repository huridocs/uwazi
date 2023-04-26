/* eslint-disable react/jsx-props-no-spreading */
import React, { useState } from 'react';
import { IncomingHttpHeaders } from 'http';
import { useLoaderData, LoaderFunction } from 'react-router-dom';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { Row } from 'react-table';
import { intersectionBy, keyBy, merge, values } from 'lodash';
import { StarIcon } from '@heroicons/react/20/solid';
import { Translate, I18NApi } from 'app/I18N';
import { RequestParams } from 'app/utils/RequestParams';
import { settingsAtom } from 'app/V2/atoms/settingsAtom';
import { ConfirmationModal } from 'app/V2/Components/UI/ConfirmationModal';
import { InstallLanguagesModal } from 'app/V2/Components/Languages/InstallLanguagesModal';
import { Button } from 'V2/Components/UI/Button';
import { Table } from 'V2/Components/UI/Table';
import { NavigationHeader } from 'V2/Components/UI/NavigationHeader';
import { notificationAtom } from 'V2/atoms';
import { LanguageSchema } from 'shared/types/commonTypes';

const languagesListLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async () =>
    I18NApi.getLanguages(new RequestParams({}, headers));

const languageLabel = ({ row }: { row: Row<LanguageSchema> }) => (
  <Translate>{`${row.original.label} (${row.original.key})`}</Translate>
);

// eslint-disable-next-line max-statements
const LanguagesList = () => {
  const { languages: collectionLanguages = [] } = useRecoilValue(settingsAtom);
  const setNotifications = useSetRecoilState(notificationAtom);

  const availableLanguages = useLoaderData() as LanguageSchema[];
  const installedLanguages = intersectionBy(availableLanguages, collectionLanguages, 'key');
  const notInstalledLanguages = availableLanguages.filter(
    l => !collectionLanguages.find(cl => cl.key === l.key)
  );
  const languages = values(
    merge(keyBy(installedLanguages, 'key'), keyBy(collectionLanguages, 'key'))
  );

  const [modalProps, setModalProps] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [actionableLanguage, setActionableLanguage] = useState<LanguageSchema>();

  const handleAction =
    (
      successMessage: string,
      action: { (requestParams: RequestParams): Promise<void> },
      key: string,
      currentLanguage?: LanguageSchema
    ) =>
    async () => {
      setShowModal(false);
      const selectedLanguage = currentLanguage || actionableLanguage;
      if (selectedLanguage) {
        try {
          await action(new RequestParams({ [key]: selectedLanguage.key }));
          setNotifications({
            type: 'success',
            text: <Translate>{successMessage}</Translate>,
          });
        } catch (e) {
          setNotifications({
            type: 'error',
            text: <Translate>An error occurred</Translate>,
            details: e.json?.error ? e.json.error : '',
          });
        }
      }
    };

  const confirmAction = (
    row: Row<LanguageSchema>,
    message: string,
    acceptLabel: string,
    handleAcceptedAction: () => void
  ) => {
    setActionableLanguage(row.values as LanguageSchema);

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
      row,
      'You are about to reset a language.',
      'Reset',
      handleAction('Language reset success', I18NApi.populateTranslations, 'locale')
    );
    setActionableLanguage(row.values as LanguageSchema);
  };

  const setDefaultLanguage = async (row: Row<LanguageSchema>) => {
    await handleAction(
      'Default language change success',
      I18NApi.setDefaultLanguage,
      'key',
      row.values as LanguageSchema
    )();
  };

  const uninstallModal = (row: Row<LanguageSchema>) => {
    confirmAction(
      row,
      'You are about to uninstall a language.',
      'Uninstall',
      handleAction('Language uninstalled success', I18NApi.deleteLanguage, 'locale')
    );
  };

  const resetButton = ({ row }: { row: Row<LanguageSchema> }) =>
    row.original.translationAvailable ? (
      <Button buttonStyle="secondary" onClick={() => resetModal(row)}>
        <Translate>Reset</Translate>
      </Button>
    ) : (
      <> </>
    );

  const defaultButton = ({ row }: { row: Row<LanguageSchema> }) => (
    <Button
      buttonStyle={row.original.default ? 'primary' : 'tertiary'}
      onClick={async () => setDefaultLanguage(row)}
    >
      <StarIcon
        className={`${
          !row.original.default ? ' w-5 text-white stroke-current stroke-gray-300 stroke-2' : 'w-5'
        }`}
      />
    </Button>
  );

  const uninstallButton = ({ row }: { row: Row<LanguageSchema> }) =>
    !row.original.default ? (
      <Button buttonStyle="secondary" onClick={() => uninstallModal(row)}>
        <Translate>Uninstall</Translate>
      </Button>
    ) : (
      <> </>
    );

  const columns = [
    {
      Header: 'Language',
      accessor: 'label',
      Cell: languageLabel,
      disableSortBy: true,
      className: 'w-9/12',
    },
    {
      accessor: 'default',
      Cell: defaultButton,
      disableSortBy: true,
      className: 'text-center w-1/12',
    },
    {
      accessor: 'key',
      Cell: resetButton,
      disableSortBy: true,
      className: 'text-center w-1/12',
    },
    {
      accessor: '_id',
      Cell: uninstallButton,
      disableSortBy: true,
      className: 'text-center w-1/12',
    },
  ];
  return (
    <div
      className="tw-content"
      style={{ width: '100%', overflowY: 'auto' }}
      data-testid="settings-languages"
    >
      <div className="flex flex-col h-full">
        <div className="flex-grow p-5">
          <NavigationHeader backUrl="/settings">
            <h1 className="text-base text-gray-700">
              <Translate>Languages</Translate>
            </h1>
          </NavigationHeader>
          <div className="mt-4" data-testid="languages">
            <Table
              columns={columns}
              data={languages}
              title={<Translate>Active languages</Translate>}
            />
          </div>
        </div>

        <div className="fixed bottom-0 left-0 w-full p-1 bg-white border-t border-gray-200 lg:sticky z-1">
          <div className="flex gap-2 p-2 pt-1">
            <Button
              buttonStyle="primary"
              onClick={() => {
                setShowInstallModal(true);
              }}
            >
              <Translate>Install language</Translate>
            </Button>
          </div>
        </div>
      </div>
      {showModal && (
        <div className="container w-10 h10">
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
