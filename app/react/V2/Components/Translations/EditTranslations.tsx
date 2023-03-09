import React from 'react';
import { Params, useLoaderData, LoaderFunction } from 'react-router-dom';
import { IncomingHttpHeaders } from 'http';
import { Table } from 'app/stories/Table';
import * as translationsAPI from 'V2/api/translations/index';
import { ClientTranslationSchema } from 'app/istore';

const editTranslationsLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  ({ params }: { params: Params }) =>
    translationsAPI.get(headers, params);

const columns = [
  { Header: 'Language', accessor: 'language', disableSortBy: true },
  { Header: '', accessor: 'languageISO', disableSortBy: true },
  { Header: 'Current Value', accessor: 'currentValue' },
];

const EditTranslations = () => {
  const translations = useLoaderData() as ClientTranslationSchema[];
  const getContextKeys = Object.keys(translations[0]?.contexts[0]?.values || {});

  return (
    <div className="tw-content" style={{ width: '100%' }}>
      <div className="p-5">
        {getContextKeys.map(contextKey => (
          <div className="mt-4">
            <Table columns={columns} data={[]} title={contextKey} />
          </div>
        ))}
      </div>
    </div>
  );
};

export { EditTranslations, editTranslationsLoader };

//   { title: 'Entity 2', created: 2, icon: 'plus' },
//   { title: 'Entity 1', created: 1, icon: 'check' },
//   { title: 'Entity 3', created: 3, icon: 'flag' },
