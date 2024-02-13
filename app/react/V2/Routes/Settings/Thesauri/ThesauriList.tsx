import { ColumnDef, createColumnHelper } from '@tanstack/react-table';
import { Translate } from 'app/I18N';
import ThesauriAPI from 'app/Thesauri/ThesauriAPI';
import { SettingsContent } from 'app/V2/Components/Layouts/SettingsContent';
import { Button, Table } from 'app/V2/Components/UI';
import { RequestParams } from 'app/utils/RequestParams';
import { IncomingHttpHeaders } from 'http';
import React from 'react';
import { LoaderFunction, useLoaderData } from 'react-router-dom';
import { ThesaurusSchema } from 'shared/types/thesaurusType';
import { EditButton, LabelHeader, ThesaurusLabel } from './components/TableComponents';

const theasauriListLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async () =>
    ThesauriAPI.getThesauri(new RequestParams({}, headers));

const ThesauriList = () => {
  const thesauri = useLoaderData() as ThesaurusSchema[];

  const columnHelper = createColumnHelper<any>();
  const columns = ({ edit }: { edit: Function }) => [
    columnHelper.accessor('name', {
      id: 'name',
      header: LabelHeader,
      cell: ThesaurusLabel,
      meta: { headerClassName: 'w-9/12' },
    }) as ColumnDef<ThesaurusSchema, 'name'>,
    columnHelper.accessor('_id', {
      header: '',
      cell: EditButton,
      enableSorting: false,
      meta: { action: edit, headerClassName: 'text-center w-1/12' },
    }) as ColumnDef<ThesaurusSchema, '_id'>,
  ];
  return (
    <div
      className="tw-content"
      style={{ width: '100%', overflowY: 'auto' }}
      data-testid="settings-languages"
    >
      <SettingsContent>
        <SettingsContent.Header title="Thesauri" />
        <SettingsContent.Body>
          <div data-testid="thesauri">
            <Table<ThesaurusSchema>
              enableSelection
              columns={columns({ edit: () => {} })}
              data={thesauri}
              title={<Translate>Thesauri</Translate>}
              initialState={{ sorting: [{ id: 'name', desc: false }] }}
            />
          </div>
        </SettingsContent.Body>
        <SettingsContent.Footer>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                // setShowInstallModal(true);
              }}
            >
              <Translate>Add Thesaurus</Translate>
            </Button>
          </div>
        </SettingsContent.Footer>
      </SettingsContent>
    </div>
  );
};

export { ThesauriList, theasauriListLoader };
