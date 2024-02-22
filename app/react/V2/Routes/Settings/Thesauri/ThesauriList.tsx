import React, { useState } from 'react';
import { ColumnDef, Row, createColumnHelper } from '@tanstack/react-table';
import { Translate } from 'app/I18N';
import ThesauriAPI from 'app/Thesauri/ThesauriAPI';
import { SettingsContent } from 'app/V2/Components/Layouts/SettingsContent';
import { Button, Table } from 'app/V2/Components/UI';
import { RequestParams } from 'app/utils/RequestParams';
import { IncomingHttpHeaders } from 'http';
import { Link, LoaderFunction, useLoaderData, useNavigate, useRevalidator } from 'react-router-dom';
import { ThesaurusSchema } from 'shared/types/thesaurusType';
import { EditButton, LabelHeader, ThesaurusLabel } from './components/TableComponents';
import { useSetRecoilState } from 'recoil';
import { notificationAtom } from 'app/V2/atoms';

const theasauriListLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async () =>
    ThesauriAPI.getThesauri(new RequestParams({}, headers));

const ThesauriList = () => {
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const thesauri = useLoaderData() as ThesaurusSchema[];
  const setNotifications = useSetRecoilState(notificationAtom);
  const [selectedThesauri, setSelectedThesauri] = useState<Row<ThesaurusSchema>[]>([]);

  const navigateToEditThesaurus = (thesaurus: Row<ThesaurusSchema>) => {
    navigate(`/settings/thesauri/edit/${thesaurus.original._id}`);
  };

  const deleteSelectedThesauri = async () => {
    try {
      const requests = selectedThesauri.map(sThesauri => {
        return ThesauriAPI.delete(new RequestParams({ _id: sThesauri.original._id }));
      });
      await Promise.all(requests);
      setNotifications({
        type: 'success',
        text: <Translate>Thesauri deleted</Translate>,
      });
    } catch (e) {
      setNotifications({
        type: 'error',
        text: e.message,
      });
    } finally {
      revalidator.revalidate();
    }
  };

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
              columns={columns({ edit: navigateToEditThesaurus })}
              data={thesauri}
              title={<Translate>Thesauri</Translate>}
              initialState={{ sorting: [{ id: 'name', desc: false }] }}
              onSelection={setSelectedThesauri}
            />
          </div>
        </SettingsContent.Body>
        <SettingsContent.Footer className="bg-indigo-50" highlighted>
          {selectedThesauri.length ? (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={deleteSelectedThesauri}
                color="error"
                data-testid="menu-delete-link"
              >
                <Translate>Delete</Translate>
              </Button>
              <Translate>Selected</Translate> {selectedThesauri.length} <Translate>of</Translate>{' '}
              {thesauri.length}
            </div>
          ) : (
            <div className="flex justify-between w-full">
              <div className="flex gap-2">
                <Link to="/settings/thesauri/new">
                  <Button type="button">
                    <Translate>Add Thesaurus</Translate>
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </SettingsContent.Footer>
      </SettingsContent>
    </div>
  );
};

export { ThesauriList, theasauriListLoader };
