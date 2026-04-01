/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { useNavigate, useRevalidator } from 'react-router';
import { SubmitHandler, UseFormReturn } from 'react-hook-form';
import { Row } from '@tanstack/react-table';
import { t } from '#app/I18N/index.js';
import { ClientThesaurus } from '#app/apiResponseTypes.js';
import * as thesauriAPI from '#V2/api/thesauri/index.js';
import { Table } from '#V2/Components/UI/index.js';
import { InputField } from '#V2/Components/Forms/index.js';
import { addSelection, sanitizeThesaurusValues } from './helpers.js';
import { columnsThesaurus, ThesaurusRow } from './components/TableComponents.js';
import { useRequestStatus } from '#V2/atoms/requestStatusAtom.js';

interface ThesaurusFormProps {
  thesaurus: ClientThesaurus;
  thesaurusValues: ThesaurusRow[];
  form: UseFormReturn<ClientThesaurus>;
  edit: (row: Row<ThesaurusRow>) => void;
  setThesaurusValues: React.Dispatch<React.SetStateAction<ThesaurusRow[]>>;
  setSelectedThesaurusValue: React.Dispatch<React.SetStateAction<ThesaurusRow[]>>;
}

const ThesaurusForm = ({
  thesaurus,
  thesaurusValues,
  form,
  edit,
  setThesaurusValues,
  setSelectedThesaurusValue,
}: ThesaurusFormProps) => {
  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors },
  } = form;

  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const { notify } = useRequestStatus();

  const handleRevalidate = async (savedThesaurus: ClientThesaurus) => {
    if (!thesaurus?._id) {
      await navigate(`../edit/${savedThesaurus._id}`, { replace: true });
    } else {
      await revalidator.revalidate();
    }
  };

  const saveThesaurus = async (data: ClientThesaurus) => {
    const thesaurusToUpdate = { ...data, values: sanitizeThesaurusValues(thesaurusValues) };
    const savedThesaurus = await thesauriAPI.save(thesaurusToUpdate);
    setValue('_id', savedThesaurus._id);
    notify(
      'success',
      thesaurus
        ? t('System', 'Thesauri updated.', null, false)
        : t('System', 'Thesauri added.', null, false)
    );
    await handleRevalidate(savedThesaurus);
  };

  const formSubmit: SubmitHandler<ClientThesaurus> = async data => {
    try {
      await saveThesaurus(data);
    } catch (e) {
      notify('error', t('System', 'Error updating thesauri.', null, false));
    }
  };

  return (
    <form onSubmit={handleSubmit(formSubmit)} id="edit-thesaurus">
      <div data-testid="thesauri" className="border rounded-md shadow-md border-gray-50">
        <Table
          data={thesaurusValues}
          columns={columnsThesaurus({ edit }, thesaurus)}
          dnd={{ enable: true, disableEditingGroups: true }}
          enableSelections
          header={
            <InputField
              clearFieldAction={() => {}}
              id="thesauri-name"
              placeholder={t('System', 'Thesauri name', null, false)}
              hasErrors={!!errors.name}
              className="grow"
              {...register('name', { required: true })}
            />
          }
          onSelect={({ selectedRows }) => {
            setSelectedThesaurusValue(() => {
              const selection: ThesaurusRow[] = [];
              thesaurusValues.forEach(item => {
                addSelection(selectedRows, selection)(item);
                item.subRows?.forEach(addSelection(selectedRows, selection));
              });
              return [...selection];
            });
          }}
          onSort={({ rows }) => {
            setThesaurusValues(rows);
          }}
        />
      </div>
    </form>
  );
};

export { ThesaurusForm };
