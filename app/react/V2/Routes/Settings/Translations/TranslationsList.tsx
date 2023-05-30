import React from 'react';
import { IncomingHttpHeaders } from 'http';
import { Link, useLoaderData, LoaderFunction } from 'react-router-dom';
import { Translate } from 'app/I18N';
import { ClientTranslationContextSchema, ClientTranslationSchema } from 'app/istore';
import { Button } from 'V2/Components/UI/Button';
import { Table } from 'V2/Components/UI/Table';
import { SettingsContent } from 'app/V2/Components/Layouts/SettingsContent';
import { Pill } from 'V2/Components/UI/Pill';
import * as translationsAPI from 'V2/api/translations/index';

const translationsListLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async () =>
    translationsAPI.get(headers);

const renderButton = ({ row }: any) => (
  <Link to={`edit/${row.values.id}`}>
    <Button buttonStyle="secondary" className="leading-4">
      <Translate>Translate</Translate>
    </Button>
  </Link>
);

const pill = ({ cell }: any) => (
  <div className="whitespace-nowrap">
    <Pill color="gray">
      <Translate>{cell.value}</Translate>
    </Pill>
  </div>
);

const columns = [
  { Header: 'Name', accessor: 'label', className: 'w-1/3' },
  { Header: 'Type', accessor: 'type', Cell: pill, className: 'w-2/3' },
  {
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
      <SettingsContent>
        <SettingsContent.Header title="Translations" />
        <SettingsContent.Body>
          <div className="mt-4" data-testid="translations">
            <Table
              columns={columns}
              data={contexts.systemContexts}
              title={<Translate>System translations</Translate>}
            />
          </div>
          <div className="mt-4" data-testid="content">
            <Table
              columns={columns}
              data={contexts.contentContexts}
              title={<Translate>Content translations</Translate>}
            />
          </div>
        </SettingsContent.Body>
      </SettingsContent>
    </div>
  );
};

export { TranslationsList, translationsListLoader };
