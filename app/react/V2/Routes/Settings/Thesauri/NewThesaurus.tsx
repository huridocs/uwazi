import { ColumnDef, Row, createColumnHelper } from '@tanstack/react-table';
import { Translate, t } from 'app/I18N';
import { SettingsContent } from 'app/V2/Components/Layouts/SettingsContent';
import { Button, Table } from 'app/V2/Components/UI';
import React, { useState } from 'react';
import { ThesaurusSchema } from 'shared/types/thesaurusType';
import { ThesaurusLabel } from './components/TableComponents';
import { InputField } from 'app/V2/Components/Forms';

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
          <div data-testid="thesauri">
            <InputField
              id="thesauri-name"
              placeholder="untitled"
              className="mb-2"
              label={<Translate>untitled</Translate>}
            />
            <Table<ThesaurusSchema>
              enableSelection
              columns={columns}
              data={[]}
              initialState={{ sorting: [{ id: 'name', desc: false }] }}
            />
          </div>
        </SettingsContent.Body>
        <SettingsContent.Footer className="bg-indigo-50">
          <div className="flex gap-2">
            <Button
              onClick={() => {
                // setShowInstallModal(true);
              }}
            >
              <Translate>Add item</Translate>
            </Button>
            <Button
              onClick={() => {
                // setShowInstallModal(true);
              }}
            >
              <Translate>Add group</Translate>
            </Button>
            <Button
              onClick={() => {
                // setShowInstallModal(true);
              }}
            >
              <Translate>Sort</Translate>
            </Button>
            <Button
              onClick={() => {
                // setShowInstallModal(true);
              }}
            >
              <Translate>Import</Translate>
            </Button>
          </div>
        </SettingsContent.Footer>
      </SettingsContent>
    </div>
  );
};

export { NewThesauri };
