import React from 'react';
import { Link, useLoaderData } from 'react-router-dom';
import { Translate } from 'app/I18N';
import { Table } from 'app/stories/Table';
import * as translationsAPI from '../../api/translations/index';

const translationsListLoader = ({ request }) => translationsAPI.get(request);

const renderButton = data => <Link to={`edit/${data.row.values.id}`}>Translate</Link>;

const TranslationsList = () => {
  const translations = useLoaderData();

  const contexts = translations[0].contexts.map(context => ({
    id: context.id,
    label: context.label,
    type: context.type,
  }));

  const systemContext = contexts.filter(context => context.type === 'Uwazi UI');
  const contentContext = contexts.filter(context => context.type !== 'Uwazi UI');

  return (
    <div className="tw-content" style={{ width: '100%' }}>
      <div className="p-5">
        <h1 className="text-2xl">Translations</h1>
        <Table
          columns={[
            { Header: 'View', accessor: 'label', id: 'view' },
            { Header: 'Type', accessor: 'type', disableSortBy: true },
            { Header: 'Action', accessor: 'id', disableSortBy: true, Cell: renderButton },
          ]}
          data={systemContext}
          title={<Translate>System</Translate>}
        />
        <Table
          columns={[
            { Header: 'View', accessor: 'label', id: 'view' },
            { Header: 'Type', accessor: 'type', disableSortBy: true },
            { Header: 'Action', accessor: 'id', disableSortBy: true, Cell: renderButton },
          ]}
          data={contentContext}
          title={<Translate>Content</Translate>}
        />
      </div>
    </div>
  );
};

export { TranslationsList, translationsListLoader };
