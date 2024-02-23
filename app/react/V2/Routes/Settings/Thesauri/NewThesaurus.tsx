import React, { useState } from 'react';
import { ColumnDef, Row, createColumnHelper } from '@tanstack/react-table';
import { Translate } from 'app/I18N';
import { SettingsContent } from 'app/V2/Components/Layouts/SettingsContent';
import { Button, Sidepanel, Table } from 'app/V2/Components/UI';
import { ThesaurusSchema, ThesaurusValueSchema } from 'shared/types/thesaurusType';
import { EditButton, ThesaurusValueLabel } from './components/TableComponents';
import { InputField } from 'app/V2/Components/Forms';
import { Link, useNavigate } from 'react-router-dom';
import { ValueForm } from './components/ValueForm';
import { useForm } from 'react-hook-form';
import ThesauriAPI from 'app/Thesauri/ThesauriAPI';
import { RequestParams } from 'app/utils/RequestParams';
import { useSetRecoilState } from 'recoil';
import { notificationAtom } from 'app/V2/atoms/notificationAtom';
import { GroupForm } from './components/GroupForm';
import { mergeValues, sanitizeThesaurusValues } from './helpers';

const NewThesauri = () => {
  const columnHelper = createColumnHelper<any>();
  const navigate = useNavigate();
  const [valueChanges, setValueChanges] = useState<ThesaurusValueSchema[]>([]);
  const [selectedValues, setSelectedValues] = useState<Row<ThesaurusValueSchema>[]>([]);
  const [isAddItemSidepanelOpen, setIsAddItemSidepanelOpen] = useState(false);
  const [isAddGroupSidepanelOpen, setIsAddGroupSidepanelOpen] = useState(false);

  const setNotifications = useSetRecoilState(notificationAtom);

  const {
    watch,
    register,
    getValues,
    handleSubmit,
    formState: { errors },
  } = useForm<ThesaurusSchema>({
    mode: 'onSubmit',
    defaultValues: { name: '', values: [] },
  });

  const addItemSubmit = (items: ThesaurusValueSchema & { groupId?: string }[]) => {
    let currentValues = [...valueChanges];
    currentValues = mergeValues(currentValues, items);

    setValueChanges(currentValues);
    setIsAddItemSidepanelOpen(false);
  };

  const addGroupSubmit = (items: ThesaurusValueSchema | ThesaurusValueSchema[]) => {
    setValueChanges(old => {
      if (Array.isArray(items)) {
        return [...old, ...items];
      }
      return [...old, items];
    });
    setIsAddGroupSidepanelOpen(false);
  };

  const submitThesauri = async (data: ThesaurusSchema) => {
    const sanitizedThesaurus = sanitizeThesaurusValues(data, valueChanges);
    console.log('Already sanitized thesaurus: ', sanitizedThesaurus);
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
      header: 'Label',
      cell: ThesaurusValueLabel,
      meta: { headerClassName: 'w-9/12' },
    }) as ColumnDef<ThesaurusValueSchema, 'label'>,
    columnHelper.accessor('id', {
      header: 'Action',
      cell: EditButton,
      enableSorting: false,
      meta: { action: () => {}, headerClassName: 'text-center w-1/12' },
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
          <div data-testid="thesauri" className="mb-4 border rounded-md shadow-sm border-gray-50">
            <div className="p-4">
              <InputField
                clearFieldAction={() => {}}
                id="thesauri-name"
                placeholder="untitled"
                className="mb-2"
                {...register('name', { required: true })}
                hasErrors={!!errors.name}
              />
            </div>
            <Table<ThesaurusValueSchema>
              enableSelection
              columns={columns}
              subRowsKey="values"
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
                <Button onClick={() => setIsAddItemSidepanelOpen(true)}>
                  <Translate>Add item</Translate>
                </Button>
                <Button styling="outline" onClick={() => setIsAddGroupSidepanelOpen(true)}>
                  <Translate>Add group</Translate>
                </Button>
                <Button styling="outline">
                  <Translate>Sort</Translate>
                </Button>
                <Button styling="outline">
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
      <Sidepanel
        title={<Translate className="uppercase">Add item</Translate>}
        isOpen={isAddItemSidepanelOpen}
        closeSidepanelFunction={() => setIsAddItemSidepanelOpen(false)}
        size="medium"
        withOverlay
      >
        <ValueForm
          submit={addItemSubmit}
          closePanel={() => setIsAddItemSidepanelOpen(false)}
          groups={valueChanges.filter((value: ThesaurusValueSchema) => Array.isArray(value.values))}
        />
      </Sidepanel>
      <Sidepanel
        title={<Translate className="uppercase">Add group</Translate>}
        isOpen={isAddGroupSidepanelOpen}
        closeSidepanelFunction={() => setIsAddGroupSidepanelOpen(false)}
        size="medium"
        withOverlay
      >
        <GroupForm submit={addGroupSubmit} closePanel={() => setIsAddGroupSidepanelOpen(false)} />
      </Sidepanel>
    </div>
  );
};

export { NewThesauri };
