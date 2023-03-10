import React from 'react';
import { IncomingHttpHeaders } from 'http';
import { Link, useLoaderData, LoaderFunction } from 'react-router-dom';
import { Button } from 'app/stories/Button';
import { Translate } from 'app/I18N';
import { Table } from 'app/stories/Table';
import { Header } from 'app/stories/Header';
import { ClientTranslationContextSchema, ClientTranslationSchema } from 'app/istore';
import * as translationsAPI from 'V2/api/translations/index';

const translationsListLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  () =>
    translationsAPI.get(headers);

const renderButton = data => (
  <Link to={`edit/${data.row.values.id}`}>
    <Button type="secondary">
      <Translate>Translate</Translate>
    </Button>
  </Link>
);

const columns = [
  { Header: 'View', accessor: 'label', disableSortBy: true, id: 'view' },
  { Header: 'Type', accessor: 'type' },
  { Header: 'Action', accessor: 'id', disableSortBy: true, Cell: renderButton },
];

const TranslationsList = () => {
  const translations = useLoaderData() as ClientTranslationSchema[];

  const contexts: {
    systemContexts: ClientTranslationContextSchema[];
    contentContexts: ClientTranslationContextSchema[];
  } = { systemContexts: [], contentContexts: [] };

  translations[0]?.contexts?.forEach(context => {
    delete context.values;
    if (context.type === 'Uwazi UI') {
      return contexts.systemContexts.push({ ...context });
    }
    return contexts.contentContexts.push({ ...context });
  });

  return (
    <div className="tw-content" style={{ width: '100%' }}>
      <div className="p-5">
        <Header backUrl="/settings">
          <h1 className="text-base">Translations</h1>
        </Header>
        <div className="mt-4">
          <Table
            columns={columns}
            data={contexts.systemContexts}
            title={<Translate>System</Translate>}
            fixedColumns
          />
        </div>
        <div className="mt-4">
          <Table
            columns={columns}
            data={contexts.contentContexts}
            title={<Translate>Content</Translate>}
            fixedColumns
          />
        </div>
      </div>
    </div>
  );
};

export { TranslationsList, translationsListLoader };
