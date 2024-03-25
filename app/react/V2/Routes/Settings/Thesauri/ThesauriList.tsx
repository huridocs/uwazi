import React, { useEffect, useState } from 'react';
import { ColumnDef, Row, createColumnHelper } from '@tanstack/react-table';
import { Translate } from 'app/I18N';
import ThesauriAPI from 'app/V2/api/thesauri';
import { SettingsContent } from 'app/V2/Components/Layouts/SettingsContent';
import { Button, Table, ConfirmationModal } from 'app/V2/Components/UI';
import { IncomingHttpHeaders } from 'http';
import { Link, LoaderFunction, useLoaderData, useNavigate, useRevalidator } from 'react-router-dom';
import { ThesaurusSchema } from 'shared/types/thesaurusType';
import {
  EditButton,
  LabelHeader,
  ActionHeader,
  TemplateHeader,
  ThesaurusLabel,
  templatesCells,
} from './components/TableComponents';
import { useSetRecoilState, useRecoilValue } from 'recoil';
import { notificationAtom, templatesAtom } from 'app/V2/atoms';
import { ClientThesaurus, Template } from 'app/apiResponseTypes';

const theasauriListLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async () =>
    ThesauriAPI.getThesauri({}, headers);

const ThesauriList = () => {
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const thesauri = useLoaderData() as ClientThesaurus[];
  const setNotifications = useSetRecoilState(notificationAtom);
  const templates = useRecoilValue(templatesAtom);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [tableThesauri, setTableThesauri] = useState<ClientThesaurus[]>([]);
  const [selectedThesauri, setSelectedThesauri] = useState<Row<ClientThesaurus>[]>([]);

  useEffect(() => {
    setTableThesauri(
      thesauri.map(thesaurus => {
        const templatesUsingIt = templates
          .map(t => {
            const usingIt = t.properties?.some(
              (property: any) => property.content === thesaurus._id
            );
            return usingIt ? t : null;
          })
          .filter(t => t) as Template[];

        return {
          ...thesaurus,
          templates: templatesUsingIt,
          disableRowSelection: Boolean(templatesUsingIt.length),
        };
      })
    );
  }, [thesauri, templates]);

  const navigateToEditThesaurus = (thesaurus: Row<ThesaurusSchema>) => {
    navigate(`/settings/thesauri/edit/${thesaurus.original._id}`);
  };

  const deleteSelectedThesauri = async () => {
    try {
      const requests = selectedThesauri.map(sThesauri => {
        return ThesauriAPI.delete({ _id: sThesauri.original._id });
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
      setShowConfirmationModal(false);
    }
  };

  const columnHelper = createColumnHelper<any>();
  const columns = ({ edit }: { edit: Function }) => [
    columnHelper.accessor('name', {
      id: 'name',
      header: LabelHeader,
      cell: ThesaurusLabel,
      meta: { headerClassName: 'w-6/12 font-medium' },
    }) as ColumnDef<ClientThesaurus, 'name'>,
    columnHelper.accessor('templates', {
      header: TemplateHeader,
      cell: templatesCells,
      enableSorting: false,
      meta: { headerClassName: 'w-6/12' },
    }) as ColumnDef<ClientThesaurus, 'templates'>,
    columnHelper.accessor('_id', {
      header: ActionHeader,
      cell: EditButton,
      enableSorting: false,
      meta: { action: edit, headerClassName: 'w-0 text-center sr-only' },
    }) as ColumnDef<ClientThesaurus, '_id'>,
  ];

  return (
    <div
      className="tw-content"
      style={{ width: '100%', overflowY: 'auto' }}
      data-testid="settings-thesauri"
    >
      <SettingsContent>
        <SettingsContent.Header title="Thesauri" />
        <SettingsContent.Body>
          <div data-testid="thesauri">
            <Table<ClientThesaurus>
              enableSelection
              columns={columns({ edit: navigateToEditThesaurus })}
              data={tableThesauri}
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
                onClick={() => setShowConfirmationModal(true)}
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
                    <Translate>Add thesaurus</Translate>
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </SettingsContent.Footer>
      </SettingsContent>
      {showConfirmationModal && (
        <ConfirmationModal
          size="lg"
          header={<Translate>Delete</Translate>}
          warningText={<Translate>Are you sure you want to delete this item?</Translate>}
          body={
            <ul className="flex flex-wrap max-w-md gap-8 list-disc list-inside">
              {selectedThesauri.map(item => (
                <li key={item.original.name}>{item.original.name}</li>
              ))}
            </ul>
          }
          onAcceptClick={deleteSelectedThesauri}
          onCancelClick={() => setShowConfirmationModal(false)}
          dangerStyle
        />
      )}
    </div>
  );
};

export { ThesauriList, theasauriListLoader };
