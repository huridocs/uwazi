import React from 'react';
import { useRecoilValue } from 'recoil';
import { Checkbox } from 'flowbite-react';
import { Translate } from 'app/I18N';
import { Table } from 'app/stories/Table';
import { translationsAtom } from './atoms';

const renderCheckbox = data => <Checkbox />;

const TranslationsList = () => {
  const translations = useRecoilValue(translationsAtom);
  console.log(translations);
  return (
    <div className="tw-content" style={{ width: '100%' }}>
      <div className="p-5">
        <h1 className="text-2xl">Translations</h1>
        <Table
          columns={[
            { id: 'select', Header: '', Cell: renderCheckbox },
            { Header: 'Icon', accessor: 'icon', disableSortBy: true },
            { Header: 'Title', accessor: 'title', id: 'title' },
            { Header: 'Date added', accessor: 'created', disableSortBy: true, className: 'italic' },
          ]}
          data={[
            { title: 'Entity 1', created: 1676306456, icon: 'check' },
            { title: 'Entity 2', created: 1676425085, icon: 'plus' },
          ]}
          title={<Translate>System</Translate>}
        />
      </div>
    </div>
  );
};

export { TranslationsList };
