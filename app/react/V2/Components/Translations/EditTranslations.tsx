import React from 'react';
import { Params, useLoaderData, LoaderFunction } from 'react-router-dom';
import { IncomingHttpHeaders } from 'http';
import { Table } from 'app/stories/Table';
import { Pill } from 'app/stories/Pill';
import { Header } from 'app/stories/Header';
import * as translationsAPI from 'V2/api/translations/index';
import { ClientTranslationSchema } from 'app/istore';
import { getTableValue } from './actions';

const editTranslationsLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  ({ params }: { params: Params }) =>
    translationsAPI.get(headers, params);

const renderPill = ({ cell }) => <Pill>{cell.value.toUpperCase()}</Pill>;

const columns = [
  { Header: 'Language', accessor: 'language', disableSortBy: true },
  { Header: '', accessor: 'languageKey', Cell: renderPill, disableSortBy: true },
  { Header: 'Current Value', accessor: 'value', disableSortBy: true },
];

const EditTranslations = () => {
  const translations = useLoaderData() as ClientTranslationSchema[];
  const contextTerms = Object.keys(translations[0].contexts[0].values || {});
  const contextLabel = translations[0].contexts[0].label;

  return (
    <div className="tw-content" style={{ width: '100%' }}>
      <div className="p-5">
        <Header backUrl="/settings/translations">
          <h1 className="text-base">Translations &gt; {contextLabel}</h1>
        </Header>
        {contextTerms.map(contextTerm => {
          const values = getTableValue(translations, contextTerm);
          return (
            <div className="mt-4">
              <Table columns={columns} data={values} title={contextTerm} fixedColumns />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export { EditTranslations, editTranslationsLoader };
