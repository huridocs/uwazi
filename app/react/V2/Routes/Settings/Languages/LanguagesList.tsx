/* eslint-disable react/jsx-props-no-spreading */
import React, { useState } from 'react';
import { IncomingHttpHeaders } from 'http';
import { useLoaderData, LoaderFunction } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { Row, RowPropGetter } from 'react-table';
import { intersectionBy, keyBy, merge, values } from 'lodash';
import { StarIcon } from '@heroicons/react/20/solid';
import { Translate, I18NApi } from 'app/I18N';
import { RequestParams } from 'app/utils/RequestParams';
import { settingsAtom } from 'app/V2/atoms/settingsAtom';
import { ConfirmationModal } from 'app/V2/Components/UI/ConfirmationModal';
import { Button } from 'V2/Components/UI/Button';
import { Table } from 'V2/Components/UI/Table';
import { NavigationHeader } from 'V2/Components/UI/NavigationHeader';

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
  const availableLanguages = useLoaderData() as LanguageSchema[];
  const installedLanguages = intersectionBy(availableLanguages, collectionLanguages, 'key');
  const languages = values(
    merge(keyBy(installedLanguages, 'key'), keyBy(collectionLanguages, 'key'))
  );

  const [modalProps, setModalProps] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [actionableLanguage, setActionableLanguage] = useState({});

  const resetButton = ({ row }: { row: Row<LanguageSchema> }) =>
    row.original.translationAvailable ? (
      <Button
        buttonStyle="secondary"
        onClick={() => {
          setModalProps({
            header: 'Are you sure?',
            body: 'You are about to reset a language.',
            acceptButton: 'Reset',
            cancelButton: 'No, cancel',
            warningText: 'Other users will be affected by this action!',
            confirmWord: 'CONFIRM',
            onAcceptClick: () => {
              setShowModal(false);
              console.log(actionableLanguage);
            },
            onCancelClick: () => setShowModal(false),
            size: 'max-w-md',
          });
          setShowModal(true);
        }}
      >
        <Translate>Reset</Translate>
      </Button>
    ) : (
      <> </>
    );
  const defaultButton = ({ row }: { row: Row<LanguageSchema> }) => (
    <Button buttonStyle={row.original.default ? 'primary' : 'tertiary'}>
      <StarIcon className="w-5 stroke-cyan-500" />
    </Button>
  );
  const uninstallButton = ({ row }: { row: Row<LanguageSchema> }) =>
    row.original.translationAvailable ? (
      <Button buttonStyle="secondary">
        <Translate>Uninstall</Translate>
      </Button>
    ) : (
      <> </>
    );

  const formatRowProps: (state: Row<LanguageSchema>) => RowPropGetter<LanguageSchema> = state => ({
    onClick: () => setActionableLanguage(state.values),
  });

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
      <div className="p-5">
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
            formatRowProps={state => formatRowProps(state)}
          />
        </div>
      </div>
      {showModal && (
        <div className="container w-10 h10">
          <ConfirmationModal {...modalProps} />
        </div>
      )}
    </div>
  );
};

export { LanguagesList, languagesListLoader };
