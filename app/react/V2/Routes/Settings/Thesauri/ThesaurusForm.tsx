/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { useNavigate, useRevalidator } from 'react-router';
import { SubmitHandler, UseFormReturn } from 'react-hook-form';
import { useSetAtom } from 'jotai';
import { Row } from '@tanstack/react-table';
// @ts-expect-error TS(2307): Cannot find module '../../I18N/index.js' or its co... Remove this comment to see the full error message
import { Translate } from '../../I18N/index.js';
// @ts-expect-error TS(2307): Cannot find module '../../apiResponseTypes.js' or ... Remove this comment to see the full error message
import { ClientThesaurus } from '../../apiResponseTypes.js';
import * as thesauriAPI from 'api/thesauri/index.js';
// @ts-expect-error TS(2307): Cannot find module '../../V2/atoms.js' or its corr... Remove this comment to see the full error message
import { notificationAtom } from '../../V2/atoms.js';
import { Table } from '../../../Components/UI/index.js';
import { InputField } from '../../../Components/Forms/index.js';
import { addSelection, sanitizeThesaurusValues } from './helpers.js';
import { columnsThesaurus, ThesaurusRow } from './components/TableComponents.js';

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
  const setNotifications = useSetAtom(notificationAtom);

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
    setNotifications({
      type: 'success',
      text: thesaurus ? (
        <Translate>Thesauri updated.</Translate>
      ) : (
        <Translate>Thesauri added.</Translate>
      ),
    });
    await handleRevalidate(savedThesaurus);
  };

  const formSubmit: SubmitHandler<ClientThesaurus> = async data => {
    try {
      await saveThesaurus(data);
    } catch (e) {
      setNotifications({
        type: 'error',
        text: <Translate>Error updating thesauri.</Translate>,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(formSubmit)} id="edit-thesaurus">
      <div data-testid="thesauri" className="border rounded-md shadow-sm border-gray-50">
        <Table
          // @ts-expect-error TS(2322): Type 'ThesaurusRow[]' is not assignable to type 'T... Remove this comment to see the full error message
          data={thesaurusValues}
          // @ts-expect-error TS(2322): Type 'AccessorKeyColumnDef<ThesaurusRow, string>[]... Remove this comment to see the full error message
          columns={columnsThesaurus({ edit }, thesaurus)}
          dnd={{ enable: true, disableEditingGroups: true }}
          enableSelections
          header={
            <InputField
              clearFieldAction={() => {}}
              id="thesauri-name"
              placeholder="Thesauri name"
              hasErrors={!!errors.name}
              className="flex-grow"
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
            // @ts-expect-error TS(2345): Argument of type 'TableRow<ThesaurusRow>[]' is not... Remove this comment to see the full error message
            setThesaurusValues(rows);
          }}
        />
      </div>
    </form>
  );
};

export { ThesaurusForm };
