import React, { useState } from 'react';
import { IncomingHttpHeaders } from 'http';
import { ColumnDef, Row, createColumnHelper } from '@tanstack/react-table';
import { Translate } from 'app/I18N';
import { SettingsContent } from 'app/V2/Components/Layouts/SettingsContent';
import { Button, Sidepanel, Table } from 'app/V2/Components/UI';
import { ThesaurusSchema, ThesaurusValueSchema } from 'shared/types/thesaurusType';
import { ActionHeader, EditButton, ThesaurusValueLabel } from './components/TableComponents';
import { InputField } from 'app/V2/Components/Forms';
import { Link, LoaderFunction, useLoaderData, useRevalidator } from 'react-router-dom';
import { useSetRecoilState } from 'recoil';
import {
  LocalThesaurusValueSchema,
  ThesauriValueFormSidepanel,
} from './components/ThesauriValueFormSidepanel';
import { ThesauriGroupFormSidepanel } from './components/ThesauriGroupFormSidepanel';
import { mergeValues, sanitizeThesaurusValues } from './helpers';
import { notificationAtom } from 'app/V2/atoms/notificationAtom';
import ThesauriAPI from 'app/Thesauri/ThesauriAPI';
import { SubmitHandler, useForm } from 'react-hook-form';
import { RequestParams } from 'app/utils/RequestParams';

const LabelHeader = () => <Translate>Label</Translate>;

const editTheasaurusLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async ({ params: { _id } }) =>
    ThesauriAPI.getThesauri(new RequestParams({ _id }, headers));

const EditThesauri = () => {
  const revalidator = useRevalidator();
  const thesaurus = (useLoaderData() as ThesaurusSchema[])[0];
  const [editGroup, setEditGroup] = useState<ThesaurusValueSchema>();
  const [editValue, setEditValue] = useState<ThesaurusValueSchema>();
  const [showThesauriValueFormSidepanel, setShowThesauriValueFormSidepanel] = useState(false);
  const [showThesauriGroupFormSidepanel, setShowThesauriGroupFormSidepanel] = useState(false);
  const [selectedThesaurusValue, setSelectedThesaurusValue] = useState<Row<ThesaurusValueSchema>[]>(
    []
  );
  const [thesaurusValues, setThesaurusValues] = useState<ThesaurusValueSchema[]>(
    thesaurus?.values || []
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

  const deleteSelected = () => {
    let newValues: ThesaurusValueSchema[] = thesaurusValues.filter(
      value => !selectedThesaurusValue.find(tSelected => tSelected.original.id === value.id)
    );

    newValues = newValues.map(value => {
      if (value.values) {
        value.values = value.values.filter(
          values => !selectedThesaurusValue.find(ttSelected => ttSelected.original.id === values.id)
        );
      }
      return value;
    });
    setThesaurusValues(newValues);
  };

  const sortValues = () => {
    const valuesCopy = [...thesaurusValues];
    valuesCopy.sort((first, second) => (first.label > second.label ? 1 : -1));
    setThesaurusValues(valuesCopy);
  };

  const addItemSubmit = (items: LocalThesaurusValueSchema[]) => {
    let currentValues: ThesaurusValueSchema[] = [...thesaurusValues];
    if (editValue) {
      // @ts-ignore
      const editItem: ThesaurusValueSchema & { groupId?: string } = items[0];
      if (editItem.groupId && editItem.groupId !== '') {
        currentValues = currentValues.map(value => {
          if (value.id === editItem.groupId) {
            // Check the item does not exist
            const existingItem = value.values?.find(eValue => eValue.id === editItem.id);
            if (existingItem) {
              value.values = value.values?.map(aValue =>
                aValue.id === existingItem.id ? editItem : aValue
              );
            } else {
              value.values?.push(editItem);
            }
          }
          return value;
        });
        currentValues = currentValues.filter(cValue => cValue.id !== editItem.id);
      } else {
        currentValues = currentValues.map(value => {
          if (value.id === (editItem as ThesaurusValueSchema).id) {
            delete editItem.groupId;
            return editItem;
          }
          return value;
        }) as ThesaurusValueSchema[];
      }
      setEditValue(undefined);
      setThesaurusValues(currentValues);
      setShowThesauriValueFormSidepanel(false);
      return;
    }
    currentValues = mergeValues(currentValues, items);

    setThesaurusValues(currentValues);
    setShowThesauriValueFormSidepanel(false);
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
      setShowThesauriGroupFormSidepanel(false);
      return;
    }
    setThesaurusValues(old => [...old, group]);
    setShowThesauriGroupFormSidepanel(false);
  };

  const formSubmit: SubmitHandler<ThesaurusSchema> = async data => {
    const sanitizedThesaurus = sanitizeThesaurusValues(data, thesaurusValues);
    try {
      await ThesauriAPI.save(new RequestParams(sanitizedThesaurus));
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
      header: LabelHeader,
      cell: ThesaurusValueLabel,
      meta: { headerClassName: 'w-11/12' },
    }) as ColumnDef<ThesaurusValueSchema, 'label'>,
    columnHelper.accessor('id', {
      header: ActionHeader,
      cell: EditButton,
      enableSorting: false,
      meta: {
        action: async (row: Row<ThesaurusValueSchema>) => {
          if (row.original.values && Array.isArray(row.original.values)) {
            setEditGroup(row.original as ThesaurusValueSchema);
            setShowThesauriGroupFormSidepanel(true);
          } else {
            // setEditValueAndShowItemSidepanel({ value: row.original, showSidepanel: true });
            await setEditValue(row.original as ThesaurusValueSchema);
            setShowThesauriValueFormSidepanel(true);
          }
        },
        headerClassName: 'text-center w-0',
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
            <div data-testid="thesauri" className="border rounded-md shadow-sm border-gray-50">
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
                draggableRows
                enableSelection
                subRowsKey="values"
                onChange={setThesaurusValues}
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
                <Button onClick={() => setShowThesauriValueFormSidepanel(true)}>
                  <Translate>Add item</Translate>
                </Button>
                <Button styling="outline" onClick={() => setShowThesauriGroupFormSidepanel(true)}>
                  <Translate>Add group</Translate>
                </Button>
                <Button styling="outline" onClick={sortValues}>
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
      <ThesauriValueFormSidepanel
        showSidepanel={showThesauriValueFormSidepanel}
        setShowSidepanel={setShowThesauriValueFormSidepanel}
        submit={addItemSubmit}
        value={editValue}
        closePanel={() => {
          setEditValue(undefined);
          setShowThesauriValueFormSidepanel(false);
        }}
        groups={thesaurusValues.filter((value: ThesaurusValueSchema) =>
          Array.isArray(value.values)
        )}
      />
      <ThesauriGroupFormSidepanel
        showSidepanel={showThesauriGroupFormSidepanel}
        setShowSidepanel={setShowThesauriGroupFormSidepanel}
        submit={addGroupSubmit}
        value={editGroup}
        closePanel={() => {
          setEditGroup(undefined);
          setShowThesauriGroupFormSidepanel(false);
        }}
      />
    </div>
  );
};

export { EditThesauri, editTheasaurusLoader };
