/* eslint-disable react/jsx-props-no-spreading */
import React, { useState } from 'react';
import { IncomingHttpHeaders } from 'http';
import { useLoaderData, LoaderFunction } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { Row } from 'react-table';
import { intersectionBy, keyBy, merge, values } from 'lodash';
import { StarIcon } from '@heroicons/react/20/solid';
import { Translate, I18NApi } from 'app/I18N';
import { RequestParams } from 'app/utils/RequestParams';
import { settingsAtom } from 'app/V2/atoms/settingsAtom';
import { ConfirmationModal } from 'app/V2/Components/UI/ConfirmationModal';
import { Button } from 'V2/Components/UI/Button';
import { Table } from 'V2/Components/UI/Table';
import { Breadcrumb } from 'app/V2/Components/UI/Breadcrumb';
import { useApiCaller } from 'V2/CustomHooks/useApiCaller';
import { LanguageSchema } from 'shared/types/commonTypes';
import { Settings } from 'shared/types/settingsType';
import { InstallLanguagesModal } from './components/InstallLanguagesModal';

const languagesListLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async () =>
    I18NApi.getLanguages(new RequestParams({}, headers));

const languageLabel = ({ row }: { row: Row<LanguageSchema> }) => (
  <Translate>{`${row.original.label} (${row.original.key})`}</Translate>
);

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
      successMessage: string,
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
        'Language reset success',
        I18NApi.populateTranslations,
        'locale',
        row.values as LanguageSchema
      )
    );
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
      'You are about to uninstall a language.',
      'Uninstall',
      handleAction(
        'Language uninstalled success',
        I18NApi.deleteLanguage,
        'key',
        row.values as LanguageSchema
      )
    );
  };

  const resetButton = ({ row }: { row: Row<LanguageSchema> }) =>
    row.original.translationAvailable ? (
      <Button styling="outline" onClick={() => resetModal(row)} className="leading-4">
        <Translate>Reset</Translate>
      </Button>
    ) : (
      <> </>
    );

  const defaultButton = ({ row }: { row: Row<LanguageSchema> }) => (
    <Button
      styling={row.original.default ? 'solid' : 'light'}
      onClick={async () => setDefaultLanguage(row)}
      className="leading-4"
    >
      <Translate className="sr-only">Default</Translate>
      <StarIcon
        className={`${
          !row.original.default ? ' w-4 text-white stroke-current stroke-gray-300 stroke-2' : 'w-4'
        }`}
      />
    </Button>
  );

  const uninstallButton = ({ row }: { row: Row<LanguageSchema> }) =>
    !row.original.default ? (
      <Button styling="outline" onClick={() => uninstallModal(row)} className="leading-4">
        <Translate>Uninstall</Translate>
      </Button>
    ) : (
      <> </>
    );

  const columns = [
    {
      Header: <Translate>Language</Translate>,
      accessor: 'label',
      Cell: languageLabel,
      className: 'w-9/12',
    },
    {
      Header: <Translate className="sr-only">Default language</Translate>,
      accessor: 'default',
      Cell: defaultButton,
      disableSortBy: true,
      className: 'text-center w-1/12',
    },
    {
      Header: <Translate className="sr-only">Reset language</Translate>,
      accessor: 'key',
      Cell: resetButton,
      disableSortBy: true,
      className: 'text-center w-1/12',
    },
    {
      Header: <Translate className="sr-only">Uninstall language</Translate>,
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
          <Breadcrumb backUrl="/settings">
            <h1 className="text-base text-gray-700">
              <Translate>Languages</Translate>
            </h1>
          </Breadcrumb>
          <div className="mt-4" data-testid="languages">
            <Table
              columns={columns}
              data={languages}
              title={<Translate>Active languages</Translate>}
              initialState={{ sortBy: [{ id: 'label' }] }}
            />
          </div>
        </div>

        <div className="fixed bottom-0 left-0 w-full p-1 bg-white border-t border-gray-200 lg:sticky z-1">
          <div className="flex gap-2 p-2 pt-1">
            <Button
              onClick={() => {
                setShowInstallModal(true);
              }}
            >
              <Translate>Install language(s)</Translate>
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
