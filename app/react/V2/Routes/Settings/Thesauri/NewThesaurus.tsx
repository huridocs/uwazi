import { ColumnDef, Row, createColumnHelper } from '@tanstack/react-table';
import { Translate, t } from 'app/I18N';
import { SettingsContent } from 'app/V2/Components/Layouts/SettingsContent';
import { Button, Table } from 'app/V2/Components/UI';
import React, { useState } from 'react';
import { ThesaurusSchema } from 'shared/types/thesaurusType';
import { ThesaurusLabel } from './components/TableComponents';
import { InputField } from 'app/V2/Components/Forms';
import { Link } from 'react-router-dom';

const NewThesauri = () => {
  const columnHelper = createColumnHelper<any>();
  const columns = [
    columnHelper.accessor('name', {
      id: 'name',
      header: 'Label',
      cell: ThesaurusLabel,
      meta: { headerClassName: 'w-9/12' },
    }) as ColumnDef<ThesaurusSchema, 'name'>,
    columnHelper.accessor('_id', {
      header: 'Action',
      cell: '',
      enableSorting: false,
      meta: { action: () => {}, headerClassName: 'text-center w-1/12' },
    }) as ColumnDef<ThesaurusSchema, '_id'>,
  ];

  return (
    <div
      className="tw-content"
      style={{ width: '100%', overflowY: 'auto' }}
      data-testid="settings-languages"
    >
      <SettingsContent>
        <SettingsContent.Header
          path={new Map([['Thesauri', '/settings/thesauri']])}
          title="untitled"
        />
        <SettingsContent.Body>
          <div data-testid="thesauri" className="mb-4 border rounded-md shadow-sm border-gray-50">
            <div className="p-4">
              <InputField
                clearFieldAction={() => {}}
                id="thesauri-name"
                placeholder="untitled"
                className="mb-2"
              />
            </div>
            <Table<ThesaurusSchema>
              enableSelection
              columns={columns}
              data={[]}
              initialState={{ sorting: [{ id: 'name', desc: false }] }}
            />
          </div>
        </SettingsContent.Body>
        <SettingsContent.Footer className="bg-indigo-50">
          <div className="flex justify-between w-full">
            <div className="flex gap-2">
              <Button>
                <Translate>Add item</Translate>
              </Button>
              <Button styling="outline">
                <Translate>Add group</Translate>
              </Button>
              <Button styling="outline">
                <Translate>Sort</Translate>
              </Button>
              <Button styling="outline">
                <Translate>Import</Translate>
              </Button>
            </div>
            <div className="flex gap-2">
              <Link to="/settings/translations">
                <Button styling="light" type="button">
                  <Translate>Cancel</Translate>
                </Button>
              </Link>
              <Button
                styling="solid"
                color="success"
                onClick={() => {
                  console.log('Saving thesauri');
                }}
              >
                <Translate>Save</Translate>
              </Button>
            </div>
          </div>
        </SettingsContent.Footer>
      </SettingsContent>
    </div>
  );
};

export { NewThesauri };
