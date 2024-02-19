import { ColumnDef, createColumnHelper } from '@tanstack/react-table';
import { Translate } from 'app/I18N';
import { SettingsContent } from 'app/V2/Components/Layouts/SettingsContent';
import { Button, Sidepanel, Table } from 'app/V2/Components/UI';
import React, { useState } from 'react';
import { ThesaurusSchema, ThesaurusValueSchema } from 'shared/types/thesaurusType';
import { EditButton, ThesaurusValueLabel } from './components/TableComponents';
import { InputField } from 'app/V2/Components/Forms';
import { Link, useNavigate } from 'react-router-dom';
import { AddItemForm } from './components/AddItemForm';
import { useForm } from 'react-hook-form';
import uniqueID from 'shared/uniqueID';
import ThesauriAPI from 'app/Thesauri/ThesauriAPI';
import { RequestParams } from 'app/utils/RequestParams';
import { useSetRecoilState } from 'recoil';
import { notificationAtom } from 'app/V2/atoms/notificationAtom';

const NewThesauri = () => {
  const columnHelper = createColumnHelper<any>();
  const navigate = useNavigate();
  const [isSidepanelOpen, setIsSidepanelOpen] = useState(false);

  const setNotifications = useSetRecoilState(notificationAtom);

  const {
    watch,
    setValue,
    register,
    getValues,
    handleSubmit,
    formState: { errors },
  } = useForm<ThesaurusSchema>({
    mode: 'onSubmit',
  });

  const addItemSubmit = (value: ThesaurusValueSchema) => {
    const id = uniqueID();
    const curatedValue = { label: value.label, id };
    setValue(
      'values',
      getValues().values
        ? [...(getValues().values as ThesaurusValueSchema[]), curatedValue]
        : [curatedValue]
    );
    setIsSidepanelOpen(false);
  };

  const submitThesauri = async (data: ThesaurusSchema) => {
    try {
      await ThesauriAPI.save(new RequestParams(data));
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
              data={getValues().values || []}
              initialState={{ sorting: [{ id: 'label', desc: false }] }}
            />
          </div>
        </SettingsContent.Body>
        <SettingsContent.Footer className="bg-indigo-50">
          <div className="flex justify-between w-full">
            <div className="flex gap-2">
              <Button onClick={() => setIsSidepanelOpen(true)}>
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
              <Button styling="solid" color="success" onClick={handleSubmit(submitThesauri)}>
                <Translate>Save</Translate>
              </Button>
            </div>
          </div>
        </SettingsContent.Footer>
      </SettingsContent>
      <Sidepanel
        title={<Translate className="uppercase">Add item</Translate>}
        isOpen={isSidepanelOpen}
        closeSidepanelFunction={() => setIsSidepanelOpen(false)}
        size="medium"
        withOverlay
      >
        <AddItemForm submit={addItemSubmit} closePanel={() => setIsSidepanelOpen(false)} />
      </Sidepanel>
    </div>
  );
};

export { NewThesauri };
