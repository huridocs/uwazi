/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { useNavigate, useRevalidator } from 'react-router-dom';
import { SubmitHandler, UseFormReturn } from 'react-hook-form';
import { useAtom, useSetAtom } from 'jotai';
import { isEqual, remove } from 'lodash';
import { Row } from '@tanstack/react-table';
import { Translate } from 'app/I18N';
import { ClientThesaurus } from 'app/apiResponseTypes';
import ThesauriAPI from 'V2/api/thesauri';
import { thesauriAtom, notificationAtom } from 'app/V2/atoms';
import { Table } from 'V2/Components/UI';
import { InputField } from 'V2/Components/Forms';
import { addSelection, sanitizeThesaurusValues } from './helpers';
import { columnsThesaurus, ThesaurusRow } from './components/TableComponents';

interface ThesaurusFormProps {
  thesaurus: ClientThesaurus;
  thesaurusValues: ThesaurusRow[];
  form: UseFormReturn<ClientThesaurus, any, undefined>;
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
  const [thesauri, setThesauri] = useAtom(thesauriAtom);
  const setNotifications = useSetAtom(notificationAtom);

  const handleRevalidate = (savedThesaurus: ClientThesaurus) => {
    if (!thesaurus?._id) {
      navigate(`../edit/${savedThesaurus._id}`);
    } else {
      revalidator.revalidate();
    }
  };

  const saveThesaurus = async (data: ClientThesaurus) => {
    const thesaurusToUpdate = { ...data, values: sanitizeThesaurusValues(thesaurusValues) };
    const savedThesaurus = await ThesauriAPI.save(thesaurusToUpdate);
    if (thesauri.find(item => item._id === savedThesaurus._id)) {
      remove(thesauri, item => item._id === savedThesaurus._id);
    }
    thesauri.push(savedThesaurus);
    setThesauri([...thesauri]);
    setValue('_id', savedThesaurus._id);
    setNotifications({
      type: 'success',
      text: thesaurus ? (
        <Translate>Thesauri updated.</Translate>
      ) : (
        <Translate>Thesauri added.</Translate>
      ),
    });
    handleRevalidate(savedThesaurus);
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
        <Table
          data={thesaurusValues}
          columns={columnsThesaurus({ edit }, thesaurus)}
          dnd={{ enable: true, disableEditingGroups: true }}
          enableSelections
          onChange={({ selectedRows, rows }) => {
            setSelectedThesaurusValue(() => {
              const selection: ThesaurusRow[] = [];
              thesaurusValues.forEach(item => {
                addSelection(selectedRows, selection)(item);
                item.subRows?.forEach(addSelection(selectedRows, selection));
              });
              return [...selection];
            });
            if (!isEqual(rows, thesaurusValues)) {
              setThesaurusValues(rows);
            }
          }}
        />
      </div>
    </form>
  );
};

export { ThesaurusForm };
