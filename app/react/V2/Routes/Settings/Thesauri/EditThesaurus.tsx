import React, { useState } from 'react';
import { ColumnDef, Row, createColumnHelper } from '@tanstack/react-table';
import { Translate } from 'app/I18N';
import { SettingsContent } from 'app/V2/Components/Layouts/SettingsContent';
import { Button, Sidepanel, Table } from 'app/V2/Components/UI';
import { ThesaurusSchema, ThesaurusValueSchema } from 'shared/types/thesaurusType';
import { EditButton, ThesaurusValueLabel } from './components/TableComponents';
import { InputField } from 'app/V2/Components/Forms';
import { Link, LoaderFunction, useLoaderData, useRevalidator } from 'react-router-dom';
import { IncomingHttpHeaders } from 'http';
import { RequestParams } from 'app/utils/RequestParams';
import ThesauriAPI from 'app/Thesauri/ThesauriAPI';
import { SubmitHandler, useForm } from 'react-hook-form';
import _ from 'lodash';
import { notificationAtom } from 'app/V2/atoms';
import { useSetRecoilState } from 'recoil';
import { ValueForm } from './components/ValueForm';
import { GroupForm } from './components/GroupForm';
import { mergeValues } from './helpers';

const editTheasaurusLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async ({ params: { _id } }) =>
    ThesauriAPI.getThesauri(new RequestParams({ _id }, headers));

const EditThesauri = () => {
  const revalidator = useRevalidator();
  const thesaurus = (useLoaderData() as ThesaurusSchema[])[0];
  const [editGroup, setEditGroup] = useState<ThesaurusValueSchema>();
  const [editValue, setEditValue] = useState<ThesaurusValueSchema>();
  const [isItemSidepanelOpen, setIsItemSidepanelOpen] = useState(false);
  const [isGroupSidepanelOpen, setIsGroupSidepanelOpen] = useState(false);
  const [selectedThesaurusValue, setSelectedThesaurusValue] = useState<Row<ThesaurusValueSchema>[]>(
    []
  );
  const [thesaurusValues, setThesaurusValues] = useState<ThesaurusValueSchema[]>(
    thesaurus.values || []
  );
  const setNotifications = useSetRecoilState(notificationAtom);

  const {
    watch,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ThesaurusSchema>({
    defaultValues: thesaurus,
    mode: 'onSubmit',
  });

  const addItemSubmit = (items: ThesaurusValueSchema & { groupId?: string }[]) => {
    const mergedValues = mergeValues(thesaurusValues, items);
    setThesaurusValues(mergedValues);
    setIsItemSidepanelOpen(false);
  };

  const addGroupSubmit = (group: ThesaurusValueSchema) => {
    if (editGroup) {
      const updatedValues = thesaurusValues.map(item => {
        if (item.id === group.id) {
          return group;
        }
        return item;
      });
      setThesaurusValues(updatedValues);
      setEditGroup(undefined);
      setIsGroupSidepanelOpen(false);
      return;
    }
    setThesaurusValues(old => [...old, group]);
    setIsGroupSidepanelOpen(false);
  };

  const deleteSelected = () => {
    let newValues: ThesaurusValueSchema[] = thesaurusValues.filter(
      value => !selectedThesaurusValue.find(selected => selected.original.id === value.id)
    );
    newValues = newValues.map(value => {
      if (value.values) {
        value.values = value.values.filter(
          values => !selectedThesaurusValue.find(selected => selected.original.id === values.id)
        );
      }
      return value;
    });
    setThesaurusValues(newValues);
  };

  const formSubmit: SubmitHandler<ThesaurusSchema> = async data => {
    data.values = thesaurusValues;
    try {
      await ThesauriAPI.save(new RequestParams(data));
      setNotifications({
        type: 'success',
        text: <Translate>Thesauri updated.</Translate>,
      });
    } catch (e) {
      setNotifications({
        type: 'error',
        text: <Translate>Error updating thesauri.</Translate>,
      });
    } finally {
      revalidator.revalidate();
    }
  };

  const columnHelper = createColumnHelper<any>();
  const columns = [
    columnHelper.accessor('label', {
      id: 'label',
      header: 'Label',
      cell: ThesaurusValueLabel,
      meta: { headerClassName: 'w-9/12' },
    }) as ColumnDef<ThesaurusValueSchema, 'label'>,
    columnHelper.accessor('id', {
      header: 'Action',
      cell: EditButton,
      enableSorting: false,
      meta: {
        action: (row: Row<ThesaurusValueSchema>) => {
          if (row.original.values && Array.isArray(row.original.values)) {
            console.log('Is group');
            setEditGroup(row.original as ThesaurusValueSchema);
            setIsGroupSidepanelOpen(true);
          } else {
            console.log('Is value');
            setEditValue(row.original as ThesaurusValueSchema);
            setIsItemSidepanelOpen(true);
          }
        },
        headerClassName: 'text-center w-1/12',
      },
    }) as ColumnDef<ThesaurusValueSchema, 'id'>,
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
          title={watch('name')}
        />
        <SettingsContent.Body>
          <form onSubmit={handleSubmit(formSubmit)} id="edit-thesaurus">
            <div data-testid="thesauri" className="mb-4 border rounded-md shadow-sm border-gray-50">
              <div className="p-4">
                <InputField
                  clearFieldAction={() => {}}
                  id="thesauri-name"
                  placeholder="Thesauri name"
                  className="mb-2"
                  hasErrors={!!errors.name}
                  {...register('name', { required: true })}
                />
              </div>
              <Table<ThesaurusValueSchema>
                enableSelection
                subRowsKey="values"
                columns={columns}
                data={thesaurusValues}
                initialState={{ sorting: [{ id: 'label', desc: false }] }}
                onSelection={setSelectedThesaurusValue}
              />
            </div>
          </form>
        </SettingsContent.Body>
        <SettingsContent.Footer className="bg-indigo-50">
          {selectedThesaurusValue.length ? (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={deleteSelected}
                color="error"
                data-testid="thesauri-remove-button"
              >
                <Translate>Remove</Translate>
              </Button>
              <Translate>Selected</Translate> {selectedThesaurusValue.length}{' '}
              <Translate>of</Translate> {thesaurus.values?.length}
            </div>
          ) : (
            <div className="flex justify-between w-full">
              <div className="flex gap-2">
                <Button onClick={() => setIsItemSidepanelOpen(true)}>
                  <Translate>Add item</Translate>
                </Button>
                <Button styling="outline" onClick={() => setIsGroupSidepanelOpen(true)}>
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
                <Link to="/settings/thesauri">
                  <Button styling="light" type="button">
                    <Translate>Cancel</Translate>
                  </Button>
                </Link>
                <Button styling="solid" color="success" type="submit" form="edit-thesaurus">
                  <Translate>Save</Translate>
                </Button>
              </div>
            </div>
          )}
        </SettingsContent.Footer>
      </SettingsContent>
      <Sidepanel
        title={
          editValue ? (
            <Translate className="uppercase">Edit item</Translate>
          ) : (
            <Translate className="uppercase">Add item</Translate>
          )
        }
        isOpen={isItemSidepanelOpen}
        closeSidepanelFunction={() => setIsItemSidepanelOpen(false)}
        size="medium"
        withOverlay
      >
        <ValueForm
          submit={addItemSubmit}
          value={editValue}
          closePanel={() => setIsItemSidepanelOpen(false)}
          groups={thesaurusValues.filter((value: ThesaurusValueSchema) =>
            Array.isArray(value.values)
          )}
        />
      </Sidepanel>
      <Sidepanel
        title={
          editGroup ? (
            <Translate className="uppercase">Edit Group</Translate>
          ) : (
            <Translate className="uppercase">Add Group</Translate>
          )
        }
        isOpen={isGroupSidepanelOpen}
        closeSidepanelFunction={() => setIsGroupSidepanelOpen(false)}
        size="medium"
        withOverlay
      >
        <GroupForm
          submit={addGroupSubmit}
          value={editGroup}
          closePanel={() => setIsGroupSidepanelOpen(false)}
        />
      </Sidepanel>
    </div>
  );
};

export { EditThesauri, editTheasaurusLoader };
