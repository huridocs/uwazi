import React from 'react';
import { IncomingHttpHeaders } from 'http';
import { Link, useLoaderData, LoaderFunction } from 'react-router-dom';
import { Translate } from 'app/I18N';
import { ClientTranslationContextSchema, ClientTranslationSchema } from 'app/istore';
import { Button } from 'V2/Components/UI/Button';
import { Table } from 'V2/Components/UI/Table';
import { NavigationHeader } from 'V2/Components/UI/NavigationHeader';
import { Pill } from 'V2/Components/UI/Pill';
import * as translationsAPI from 'V2/api/translations/index';

const translationsListLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async () =>
    translationsAPI.get(headers);

const renderButton = data => (
  <Link to={`edit/${data.row.values.id}`}>
    <Button buttonStyle="secondary">
      <Translate>Translate</Translate>
    </Button>
  </Link>
);

const pill = ({ cell }) => (
  <div className="whitespace-nowrap">
    <Pill color="gray">
      <Translate>{cell.value}</Translate>
    </Pill>
  </div>
);

const columns = [
  { key: '1', Header: 'View', accessor: 'label', disableSortBy: true, className: 'w-1/3' },
  { key: '2', Header: 'Type', accessor: 'type', Cell: pill, className: 'w-2/3' },
  {
    key: '3',
    Header: 'Action',
    accessor: 'id',
    Cell: renderButton,
    disableSortBy: true,
    className: 'text-center w-0',
  },
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
    <div
      className="tw-content"
      style={{ width: '100%', overflowY: 'auto' }}
      data-testid="settings-translations"
    >
      <div className="p-5">
        <NavigationHeader backUrl="/settings">
          <h1 className="text-base text-gray-700">
            <Translate>Translations</Translate>
          </h1>
        </NavigationHeader>
        <div className="mt-4" data-testid="translations">
          <Table
            columns={columns}
            data={contexts.systemContexts}
            title={<Translate>System</Translate>}
          />
        </div>
        <div className="mt-4" data-testid="content">
          <Table
            columns={columns}
            data={contexts.contentContexts}
            title={<Translate>Content</Translate>}
          />
        </div>
      </div>
    </div>
  );
};

export { TranslationsList, translationsListLoader };
