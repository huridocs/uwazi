import React from 'react';
import { Link, useLoaderData } from 'react-router-dom';
import { Button } from 'flowbite-react';
import { Translate } from 'app/I18N';
import { Table } from 'app/stories/Table';
import { ClientTranslationContextSchema, ClientTranslationSchema } from 'app/istore';
import * as translationsAPI from '../../api/translations/index';

const translationsListLoader = ({ request }: { request: Request }) => translationsAPI.get(request);

const renderButton = data => (
  <Link to={`edit/${data.row.values.id}`}>
    <Button outline size="sm">
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
        <h1 className="text-2xl">Translations</h1>
        <Table
          columns={columns}
          data={contexts.systemContexts}
          title={<Translate>System</Translate>}
        />
        <Table
          columns={columns}
          data={contexts.contentContexts}
          title={<Translate>Content</Translate>}
        />
      </div>
    </div>
  );
};

export { TranslationsList, translationsListLoader };
