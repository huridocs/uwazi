import { ColumnDef, Row, createColumnHelper } from '@tanstack/react-table';
import { Translate } from 'app/I18N';
import { SettingsContent } from 'app/V2/Components/Layouts/SettingsContent';
import { Button, Table } from 'app/V2/Components/UI';
import React, { useState } from 'react';
import { ThesaurusSchema, ThesaurusValueSchema } from 'shared/types/thesaurusType';
import { EditButton } from './components/TableComponents';
import { InputField } from 'app/V2/Components/Forms';
import { Link, LoaderFunction, useLoaderData, useRevalidator } from 'react-router-dom';
import { IncomingHttpHeaders } from 'http';
import { RequestParams } from 'app/utils/RequestParams';
import ThesauriAPI from 'app/Thesauri/ThesauriAPI';
import { SubmitHandler, useForm } from 'react-hook-form';
import _ from 'lodash';
import { notificationAtom } from 'app/V2/atoms';
import { useSetRecoilState } from 'recoil';

const editTheasaurusLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async ({ params: { _id } }) =>
    ThesauriAPI.getThesauri(new RequestParams({ _id }, headers));

const ThesaurusValueLabel = ({ cell }: any) => {
  return <Translate>{`${cell.row.original.label}`}</Translate>;
};

const EditThesauri = () => {
  const revalidator = useRevalidator();
  const thesaurus = (useLoaderData() as ThesaurusSchema[])[0];
  const [selectedThesaurusValue, setSelectedThesaurusValue] = useState<Row<ThesaurusValueSchema>[]>(
    []
  );
  const [thesaurusValues, setThesaurusValues] = useState<ThesaurusValueSchema[]>(
    thesaurus.values || []
  );
  const setNotifications = useSetRecoilState(notificationAtom);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ThesaurusSchema>({
    defaultValues: thesaurus,
    mode: 'onSubmit',
  });

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
    // const formData = new FormData();
    // const values = prepareValuesToSave(data.formValues, translations);
    // formData.set('intent', 'form-submit');
    // formData.set('data', JSON.stringify(values));
    // fetcher.submit(formData, { method: 'post' });
    // reset({}, { keepValues: true });
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
                onClick={() => {}}
                color="primary"
                styling="outline"
                data-testid="thesauri-group-button"
              >
                <Translate>Group</Translate>
              </Button>
              <Button
                type="button"
                onClick={() => {}}
                color="primary"
                styling="outline"
                data-testid="thesauri-ungroup-button"
              >
                <Translate>Ungroup</Translate>
              </Button>
              <Button
                type="button"
                onClick={() => {
                  const selectedValues = selectedThesaurusValue.map(value => value.original);
                  const remainingValues = thesaurusValues.filter(
                    value => !selectedValues.includes(value)
                  );
                  setThesaurusValues(remainingValues);
                }}
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
                <Button styling="solid" color="success" type="submit" form="edit-thesaurus">
                  <Translate>Save</Translate>
                </Button>
              </div>
            </div>
          )}
        </SettingsContent.Footer>
      </SettingsContent>
    </div>
  );
};

export { EditThesauri, editTheasaurusLoader };
