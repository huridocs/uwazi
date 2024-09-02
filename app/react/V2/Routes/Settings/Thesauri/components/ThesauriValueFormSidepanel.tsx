/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect } from 'react';
import { SubmitHandler, useFieldArray, useForm } from 'react-hook-form';
import CheckCircleIcon from '@heroicons/react/20/solid/CheckCircleIcon';
import { isEmpty, last } from 'lodash';
import { Translate } from 'app/I18N';
import { InputField, Select } from 'app/V2/Components/Forms';
import { Button, Card, Sidepanel } from 'app/V2/Components/UI';
import uniqueID from 'shared/uniqueID';
import { ThesaurusRow } from './TableComponents';

interface ThesauriValueFormSidepanelProps {
  closePanel: () => void;
  value: ThesaurusRow[];
  thesaurusValues?: ThesaurusRow[];
  showSidepanel: boolean;
  submit: SubmitHandler<ThesaurusRow[]>;
}

const emptyRow = () => ({ label: '', rowId: uniqueID() });

const ThesauriValueFormSidepanel = ({
  submit,
  closePanel,
  thesaurusValues,
  value,
  showSidepanel,
}: ThesauriValueFormSidepanelProps) => {
  const editMode = value.length === 1;
  const groups = (thesaurusValues || []).filter(item => item.subRows !== undefined);
  const { reset, control, register, handleSubmit, watch } = useForm<{
    newValues: ThesaurusRow[];
  }>({
    mode: 'onSubmit',
    defaultValues: { newValues: value.length ? value : [emptyRow()] },
  });

  useEffect(() => {
    reset({ newValues: value.length ? value : [emptyRow()] });
  }, [reset, value]);

  const { append, fields } = useFieldArray({ control, name: 'newValues', keyName: 'rowId' });

  useEffect(() => {
    const subscription = watch(formData => {
      const values = formData.newValues;
      if (!editMode && !isEmpty(last(values)?.label)) {
        append(emptyRow(), { shouldFocus: false });
      }
    });
    return () => subscription.unsubscribe();
  }, [editMode, watch, append, value]);

  const submitHandler = (data: { newValues: ThesaurusRow[] }) => {
    submit(data.newValues.filter(thesaurus => thesaurus.label !== ''));
    closePanel();
  };

  return (
    <Sidepanel
      isOpen={showSidepanel}
      withOverlay
      closeSidepanelFunction={closePanel}
      title={editMode ? <Translate>Edit item</Translate> : <Translate>Add item</Translate>}
    >
      <form
        onSubmit={handleSubmit(submitHandler)}
        className="flex flex-col h-full"
        id="value-thesauri-form"
        data-testid="value-thesauri-form"
      >
        <Sidepanel.Body>
          {value.length === 0 && (
            <div className="p-4 mb-4 border rounded-md shadow-sm border-gray-50 bg-primary-100 text-primary-700">
              <div className="flex items-center gap-1 text-base font-semibold">
                <div className="w-5 h-5 text-sm">
                  <CheckCircleIcon />
                </div>
                <Translate>Adding items to the thesauri</Translate>
              </div>
              <div className="force-ltr">
                <Translate>You can add one or many items in this form.</Translate>
                <br />
                <Translate translationKey="thesauri new item desc">
                  Once you type the first item name, a new item form will appear underneath it, so
                  you can keep on adding as many as you want.
                </Translate>
              </div>
            </div>
          )}
          {fields.map((localValue, index) => (
            <Card title={<Translate>Item</Translate>} key={localValue.rowId}>
              <div className="flex flex-col gap-4">
                <InputField
                  id="item-name"
                  data-testid="thesauri-form-item-name"
                  label={<Translate>Title</Translate>}
                  {...register(`newValues.${index}.label`)}
                />
                {groups && (
                  <Select
                    id="item-group"
                    data-testid="thesauri-form-item-group"
                    label={<Translate>Group</Translate>}
                    {...register(`newValues.${index}.groupId`)}
                    disabled={value.length > 0}
                    options={[
                      { value: '', label: 'No Group', key: '0' },
                      ...groups.map(group => ({
                        value: group.rowId,
                        label: group.label,
                        key: group.rowId,
                      })),
                    ]}
                  />
                )}
              </div>
            </Card>
          ))}
        </Sidepanel.Body>
        <Sidepanel.Footer className="bottom-0 px-4 py-3">
          <div className="flex gap-2">
            <Button
              styling="light"
              onClick={closePanel}
              className="grow"
              data-testid="thesaurus-form-cancel"
            >
              <Translate>Cancel</Translate>
            </Button>
            <Button className="grow" type="submit" data-testid="thesaurus-form-submit">
              {!editMode && <Translate>Add</Translate>}
              {editMode && <Translate>Edit</Translate>}
            </Button>
          </div>
        </Sidepanel.Footer>
      </form>
    </Sidepanel>
  );
};

export { ThesauriValueFormSidepanel };
