import { ColumnDef, Row, createColumnHelper } from '@tanstack/react-table';
import { Translate, t } from 'app/I18N';
import { SettingsContent } from 'app/V2/Components/Layouts/SettingsContent';
import { Button, Table } from 'app/V2/Components/UI';
import React, { useEffect, useState } from 'react';
import { ThesaurusSchema, ThesaurusValueSchema } from 'shared/types/thesaurusType';
import { EditButton, ThesaurusLabel } from './components/TableComponents';
import { InputField } from 'app/V2/Components/Forms';
import { Link, LoaderFunction, useLoaderData } from 'react-router-dom';
import { IncomingHttpHeaders } from 'http';
import { RequestParams } from 'app/utils/RequestParams';
import ThesauriAPI from 'app/Thesauri/ThesauriAPI';
import { SubmitHandler, useForm } from 'react-hook-form';
import { FormValue } from 'app/Forms';

const editTheasaurusLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async ({ params: { _id } }) =>
    ThesauriAPI.getThesauri(new RequestParams({ _id }, headers));

const ThesaurusValueLabel = ({ cell }: any) => {
  return <Translate>{`${cell.row.original.label}`}</Translate>;
};

const EditThesauri = () => {
  const thesaurus = (useLoaderData() as ThesaurusSchema[])[0];
  const [selectedThesaurusValue, setSelectedThesaurusValue] = useState<Row<ThesaurusValueSchema>[]>(
    []
  );

  const {
    register,
    handleSubmit,
    setValue,
    getFieldState,
    reset,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    formState: { dirtyFields, isSubmitting: formIsSubmitting, isSubmitSuccessful },
  } = useForm<ThesaurusSchema>({
    defaultValues: { formValues: thesaurus },
    mode: 'onSubmit',
  });

  const formSubmit: SubmitHandler<ThesaurusSchema> = async data => {
    console.log('Form values: ', data);
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
    columnHelper.accessor('_id', {
      header: 'Action',
      cell: EditButton,
      enableSorting: false,
      meta: { action: () => {}, headerClassName: 'text-center w-1/12' },
    }) as ColumnDef<ThesaurusValueSchema, '_id'>,
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
          title={thesaurus.name}
        />
        <SettingsContent.Body>
          <form onSubmit={handleSubmit(formSubmit)} id="edit-thesaurus">
            <div data-testid="thesauri" className="mb-4 border rounded-md shadow-sm border-gray-50">
              <div className="p-4">
                <InputField
                  clearFieldAction={() => {}}
                  id="thesauri-name"
                  placeholder="untitled"
                  className="mb-2"
                  {...register('name', { required: true })}
                />
              </div>
              <Table<ThesaurusValueSchema>
                enableSelection
                columns={columns}
                data={thesaurus.values ? thesaurus.values : []}
                initialState={{ sorting: [{ id: 'name', desc: false }] }}
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
                onClick={() => {}}
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
