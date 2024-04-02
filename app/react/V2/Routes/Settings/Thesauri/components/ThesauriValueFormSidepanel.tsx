import React, { useEffect } from 'react';
import CheckCircleIcon from '@heroicons/react/20/solid/CheckCircleIcon';
import { Translate } from 'app/I18N';
import { InputField, Select } from 'app/V2/Components/Forms';
import { Button, Card, Sidepanel } from 'app/V2/Components/UI';
import { SubmitHandler, useFieldArray, useForm } from 'react-hook-form';
import { ClientThesaurusValue } from 'app/apiResponseTypes';
import { TableThesaurusValue } from './TableComponents';
import uniqueID from 'shared/uniqueID';

interface FormThesauriValue extends TableThesaurusValue {
  groupId?: string;
}

interface ThesauriValueFormSidepanelProps {
  closePanel: () => void;
  value: FormThesauriValue[];
  groups?: FormThesauriValue[];
  showSidepanel: boolean;
  submit: SubmitHandler<FormThesauriValue[]>;
}

const ThesauriValueFormSidepanel = ({
  submit,
  closePanel,
  groups,
  value,
  showSidepanel,
}: ThesauriValueFormSidepanelProps) => {
  const { reset, control, register, handleSubmit, watch } = useForm<{
    newValues: FormThesauriValue[];
  }>({
    mode: 'onSubmit',
    defaultValues: { newValues: value.length ? value : [{ label: '', _id: `temp_${uniqueID()}` }] },
  });

  useEffect(() => {
    reset({ newValues: value.length ? value : [{ label: '' }] });
  }, [reset, value]);

  const { append, fields } = useFieldArray({ control, name: 'newValues', keyName: 'tempId' });

  useEffect(() => {
    // if editing, don't append new fields
    if (!value.length) {
      const subscription = watch(formData => {
        const values = (formData as { newValues: FormThesauriValue[] }).newValues
          ? (formData as { newValues: FormThesauriValue[] }).newValues
          : [formData];
        // @ts-ignore
        if (values[values.length - 1].label !== '') {
          // @ts-ignore
          append({ label: '' }, { shouldFocus: false });
        }
      });
      return () => subscription.unsubscribe();
    }
  }, [watch, append, value]);

  const submitHandler = (data: { newValues: FormThesauriValue[] }) => {
    submit(data.newValues.filter(thesaurus => thesaurus.label !== ''));
    closePanel();
  };

  return (
    <Sidepanel
      isOpen={showSidepanel}
      withOverlay
      closeSidepanelFunction={closePanel}
      title={value.length > 0 ? <Translate>Edit item</Translate> : <Translate>Add item</Translate>}
    >
      <form
        onSubmit={handleSubmit(submitHandler)}
        className="flex flex-col h-full"
        id="value-thesauri-form"
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
            <Card title={<Translate>Item</Translate>} key={localValue.tempId}>
              <div className="flex flex-col gap-4">
                <InputField
                  id="item-name"
                  data-testid="thesauri-form-item-name"
                  label={<Translate>Title</Translate>}
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  {...register(`newValues.${index}.label`)}
                  // onBlur={e => setTyping(e.target.value)}
                />
                {groups && (
                  <Select
                    id="item-group"
                    data-testid="thesauri-form-item-group"
                    label={<Translate>Group</Translate>}
                    // eslint-disable-next-line react/jsx-props-no-spreading
                    {...register(`newValues.${index}.groupId`)}
                    disabled={value.length > 0}
                    options={[
                      { value: '', label: 'No Group', key: '0' },
                      ...groups.map(group => ({
                        value: group._id as string,
                        label: group.label as string,
                        key: group._id as string,
                      })),
                    ]}
                  />
                )}
              </div>
            </Card>
          ))}
        </Sidepanel.Body>
        <Sidepanel.Footer className="bottom-0">
          <div className="flex gap-2">
            <Button
              styling="light"
              onClick={closePanel}
              className="grow"
              data-testid="menu-form-cancel"
            >
              <Translate>Cancel</Translate>
            </Button>
            <Button className="grow" type="submit" data-testid="thesaurus-form-submit">
              <Translate>Add</Translate>
            </Button>
          </div>
        </Sidepanel.Footer>
      </form>
    </Sidepanel>
  );
};

export { ThesauriValueFormSidepanel };
export type { ClientThesaurusValue, FormThesauriValue };
