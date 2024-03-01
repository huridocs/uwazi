import React, { useState } from 'react';
import { ColumnDef, Row, createColumnHelper } from '@tanstack/react-table';
import { Translate } from 'app/I18N';
import { SettingsContent } from 'app/V2/Components/Layouts/SettingsContent';
import { Button, Sidepanel, Table } from 'app/V2/Components/UI';
import { ThesaurusSchema, ThesaurusValueSchema } from 'shared/types/thesaurusType';
import {
  EditButton,
  LabelHeader,
  ActionHeader,
  ThesaurusValueLabel,
} from './components/TableComponents';
import { InputField } from 'app/V2/Components/Forms';
import { Link, useNavigate } from 'react-router-dom';
import {
  LocalThesaurusValueSchema,
  ThesauriValueFormSidepanel,
} from './components/ThesauriValueFormSidepanel';
import { useForm } from 'react-hook-form';
import ThesauriAPI from 'app/Thesauri/ThesauriAPI';
import { RequestParams } from 'app/utils/RequestParams';
import { useSetRecoilState } from 'recoil';
import { notificationAtom } from 'app/V2/atoms/notificationAtom';
import { ThesauriGroupFormSidepanel } from './components/ThesauriGroupFormSidepanel';
import { mergeValues, sanitizeThesaurusValues } from './helpers';

const NewThesauri = () => {
  const navigate = useNavigate();
  const columnHelper = createColumnHelper<any>();
  const [editGroup, setEditGroup] = useState<ThesaurusValueSchema>();
  const [editValue, setEditValue] = useState<ThesaurusValueSchema>();
  const [valueChanges, setValueChanges] = useState<ThesaurusValueSchema[]>([]);
  const [selectedValues, setSelectedValues] = useState<Row<ThesaurusValueSchema>[]>([]);
  const [showThesauriGroupFormSidepanel, setShowThesauriGroupFormSidepanel] = useState(false);
  const [showThesauriValueFormSidepanel, setShowThesauriValueFormSidepanel] = useState(false);

  const setNotifications = useSetRecoilState(notificationAtom);

  const {
    watch,
    register,
    setValue,
    getValues,
    handleSubmit,
    formState: { errors },
  } = useForm<ThesaurusSchema>({
    mode: 'onSubmit',
    defaultValues: { name: '', values: [] },
  });

  const sortValues = () => {
    const valuesCopy = [...valueChanges];
    valuesCopy.sort((first, second) => (first.label > second.label ? 1 : -1));
    setValueChanges(valuesCopy);
  };

  const addItemSubmit = (items: LocalThesaurusValueSchema[]) => {
    let currentValues: ThesaurusValueSchema[] = [...valueChanges];
    if (editValue) {
      // @ts-ignore
      const editItem: LocalThesaurusValueSchema = items[0];
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
      setValueChanges(currentValues);
      setShowThesauriValueFormSidepanel(false);
      return;
    }
    currentValues = mergeValues(currentValues, items);

    setValueChanges(currentValues);
    setShowThesauriValueFormSidepanel(false);
  };

  const addGroupSubmit = (group: ThesaurusValueSchema) => {
    if (editGroup) {
      const updatedValues = valueChanges.map(item => {
        if (item.id === group.id) {
          return group;
        }
        return item;
      });
      setValueChanges(updatedValues);
      setEditGroup(undefined);
      setShowThesauriGroupFormSidepanel(false);
      return;
    }
    setValueChanges(old => [...old, group]);
    setShowThesauriGroupFormSidepanel(false);
  };

  const submitThesauri = async (data: ThesaurusSchema) => {
    const sanitizedThesaurus = sanitizeThesaurusValues(data, valueChanges);
    try {
      await ThesauriAPI.save(new RequestParams(sanitizedThesaurus));
      setNotifications({
        type: 'success',
        text: <Translate>Thesauri added.</Translate>,
      });
      navigate('/settings/thesauri');
    } catch (e) {
      setNotifications({
        type: 'error',
        text: <Translate>Error adding thesauri.</Translate>,
      });
    }
  };

  const deleteSelected = () => {
    let newValues: ThesaurusValueSchema[] = valueChanges.filter(
      value => !selectedValues.find(selected => selected.original.id === value.id)
    );
    newValues = newValues.map(value => {
      if (value.values) {
        value.values = value.values.filter(
          values => !selectedValues.find(selected => selected.original.id === values.id)
        );
      }
      return value;
    });
    setValueChanges(newValues);
  };

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
        action: (row: Row<ThesaurusValueSchema>) => {
          if (row.original.values && Array.isArray(row.original.values)) {
            setEditGroup(row.original as ThesaurusValueSchema);
            setShowThesauriGroupFormSidepanel(true);
          } else {
            setEditValue(row.original as ThesaurusValueSchema);
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
      data-testid="settings-thesauri"
    >
      <SettingsContent>
        <SettingsContent.Header
          path={new Map([['Thesauri', '/settings/thesauri']])}
          title={watch('name')}
        />
        <SettingsContent.Body>
          <div
            data-testid="settings-new-thesauri"
            className="border rounded-md shadow-sm border-gray-50"
          >
            <div className="p-4">
              <InputField
                clearFieldAction={() => {
                  setValue('name', '');
                }}
                id="thesauri-name"
                placeholder="Thesaurus name"
                {...register('name', { required: true })}
                hasErrors={!!errors.name}
              />
            </div>
            <Table<ThesaurusValueSchema>
              draggableRows
              enableSelection
              columns={columns}
              subRowsKey="values"
              onChange={setValueChanges}
              data={valueChanges}
              initialState={{ sorting: [{ id: 'label', desc: false }] }}
              onSelection={setSelectedValues}
            />
          </div>
        </SettingsContent.Body>
        <SettingsContent.Footer className="bg-indigo-50">
          <div className="flex justify-between w-full">
            {selectedValues.length ? (
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={deleteSelected}
                  color="error"
                  data-testid="menu-delete-link"
                >
                  <Translate>Remove</Translate>
                </Button>
                <Translate>Selected</Translate> {selectedValues.length} <Translate>of</Translate>{' '}
                {getValues().values?.length}
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowThesauriValueFormSidepanel(true)}
                  data-testid="thesaurus-add-item"
                >
                  <Translate>Add item</Translate>
                </Button>
                <Button
                  styling="outline"
                  onClick={() => setShowThesauriGroupFormSidepanel(true)}
                  data-testid="thesaurus-add-group"
                >
                  <Translate>Add group</Translate>
                </Button>
                <Button styling="outline" data-testid="thesaurus-sort-items" onClick={sortValues}>
                  <Translate>Sort</Translate>
                </Button>
                <Button styling="outline" data-testid="thesaurus-import-items">
                  <Translate>Import</Translate>
                </Button>
              </div>
            )}
            <div className="flex gap-2">
              <Link to="/settings/translations">
                <Button styling="light" type="button">
                  <Translate>Cancel</Translate>
                </Button>
              </Link>
              <Button styling="solid" color="success" onClick={handleSubmit(submitThesauri)}>
                <Translate>Save</Translate>
              </Button>
            </div>
          </div>
        </SettingsContent.Footer>
      </SettingsContent>
      <ThesauriValueFormSidepanel
        showSidepanel={showThesauriValueFormSidepanel}
        setShowSidepanel={() => setShowThesauriValueFormSidepanel(false)}
        submit={addItemSubmit}
        value={editValue}
        closePanel={() => {
          setEditValue(undefined);
          setShowThesauriValueFormSidepanel(false);
        }}
        groups={valueChanges.filter((value: ThesaurusValueSchema) => Array.isArray(value.values))}
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

export { NewThesauri };
