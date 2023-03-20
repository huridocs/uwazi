import React from 'react';
import { IncomingHttpHeaders } from 'http';
import { Link, useLoaderData, LoaderFunction } from 'react-router-dom';
import { Button } from 'app/stories/Button';
import { Translate } from 'app/I18N';
import { Table } from 'app/stories/Table';
import { NavigationHeader } from 'app/stories/NavigationHeader';
import { Pill } from 'app/stories/Pill';
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

const pill = ({ cell }) => <Pill color="gray">{cell.value}</Pill>;

const columns = [
  { key: '1', Header: 'View', accessor: 'label', disableSortBy: true },
  { key: '2', Header: 'Type', accessor: 'type', Cell: pill },
  { key: '3', Header: 'Action', accessor: 'id', Cell: renderButton, disableSortBy: true },
];

const TranslationsList = () => {
  const translations = useLoaderData() as ClientTranslationSchema[];

  const contexts: {
    systemContexts: ClientTranslationContextSchema[];
    contentContexts: ClientTranslationContextSchema[];
  } = { systemContexts: [], contentContexts: [] };

  translations[0]?.contexts?.forEach(context => {
    const contextTranslations = { ...context };

    if (!contextTranslations.values || Object.keys(contextTranslations.values).length === 0) {
      return undefined;
    }

    delete contextTranslations.values;

    if (contextTranslations.type === 'Uwazi UI') {
      return contexts.systemContexts.push({ ...contextTranslations });
    }

    return contexts.contentContexts.push({ ...contextTranslations });
  });

  return (
    <div className="tw-content" style={{ width: '100%' }}>
      <div className="p-5">
        <NavigationHeader backUrl="/settings">
          <h1 className="text-base text-gray-700">Translations</h1>
        </NavigationHeader>
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
