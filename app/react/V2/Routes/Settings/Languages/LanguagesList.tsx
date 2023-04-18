import React from 'react';
import { IncomingHttpHeaders } from 'http';
import { LoaderFunction } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { StarIcon } from '@heroicons/react/20/solid';
import { Translate, I18NApi } from 'app/I18N';
import { Button } from 'V2/Components/UI/Button';
import { Table } from 'V2/Components/UI/Table';
import { NavigationHeader } from 'V2/Components/UI/NavigationHeader';
import { settingsAtom } from 'app/V2/atoms/settingsAtom';
import { LanguageSchema } from 'shared/types/commonTypes';
import { Row } from 'react-table';

const languagesListLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async () =>
    I18NApi.getLanguages(headers);

const languageLabel = ({ row }: { row: Row<LanguageSchema> }) => (
  <Translate>{`${row.original.label} (${row.original.key})`}</Translate>
);

const defaultButton = ({ row }: { row: Row<LanguageSchema> }) => (
  <>
    <Button buttonStyle={row.original.default ? 'tertiary' : 'primary'}>
      <StarIcon color="blue" />
    </Button>
    <StarIcon color="blue" />
  </>
);
const resetButton = ({ row }: { row: Row<LanguageSchema> }) => (
  <Button buttonStyle={row.original.key === 'es' ? 'tertiary' : 'primary'}>
    <Translate>Reset</Translate>
  </Button>
);

const uninstallButton = ({ row }: { row: Row<LanguageSchema> }) => (
  <Button buttonStyle={row.original.default ? 'tertiary' : 'primary'}>
    <Translate>Uninstall</Translate>
  </Button>
);
const columns = [
  { Header: 'Language', accessor: 'label', Cell: languageLabel, className: 'w-9/12' },
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

const LanguagesList = () => {
  const { languages = [] } = useRecoilValue(settingsAtom);

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
          />
        </div>
      </div>
    </div>
  );
};

export { LanguagesList, languagesListLoader };
