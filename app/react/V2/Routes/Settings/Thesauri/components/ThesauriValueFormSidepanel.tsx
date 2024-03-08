import React, { useEffect, useState } from 'react';
import CheckCircleIcon from '@heroicons/react/20/solid/CheckCircleIcon';
import { Translate } from 'app/I18N';
import { InputField, Select } from 'app/V2/Components/Forms';
import { Button, Card, Sidepanel } from 'app/V2/Components/UI';
import { SubmitHandler, useFieldArray, useForm } from 'react-hook-form';
import uniqueID from 'shared/uniqueID';
import { LocalThesaurusValueSchema } from 'app/apiResponseTypes';

interface ThesauriValueFormSidepanelProps {
  closePanel: () => void;
  value?: LocalThesaurusValueSchema;
  groups?: LocalThesaurusValueSchema[];
  showSidepanel: boolean;
  setShowSidepanel: React.Dispatch<React.SetStateAction<boolean>>;
  submit: SubmitHandler<LocalThesaurusValueSchema[]>;
}

const ThesauriValueFormSidepanel = ({
  submit,
  closePanel,
  groups,
  value,
  showSidepanel,
  setShowSidepanel,
}: ThesauriValueFormSidepanelProps) => {
  const [parentGroup, setParentGroup] = useState<LocalThesaurusValueSchema | undefined>();

  const { reset, control, register, handleSubmit, watch } = useForm<
    { newValues: LocalThesaurusValueSchema[] } | LocalThesaurusValueSchema
  >({
    mode: 'onSubmit',
  });

  const { append, fields } = useFieldArray({ control, name: 'newValues', keyName: 'tempId' });

  useEffect(() => {
    reset(value || { newValues: [{ label: '' }] });
  }, [value]);

  useEffect(() => {
    const subscription = watch(formData => {
      const values = (formData as { newValues: LocalThesaurusValueSchema[] }).newValues
        ? (formData as { newValues: LocalThesaurusValueSchema[] }).newValues
        : [formData];
      // @ts-ignore
      if (values[values.length - 1].label !== '') {
        // @ts-ignore
        append({ label: '' }, { shouldFocus: false });
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, append]);

  useEffect(() => {
    if (value && groups) {
      const group = groups.find(singleGroup => {
        return singleGroup.values?.includes(value);
      });
      setParentGroup(group);
    }
  }, [value, groups]);

  const renderInputs = () => {
    if (!value) {
      return fields.map((localValue, index) => (
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
                value={parentGroup ? parentGroup._id : undefined}
                disabled={!!parentGroup}
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
      ));
    }
    return (
      <Card title={<Translate>Item</Translate>}>
        <div className="flex flex-col gap-4">
          <InputField
            id="item-name"
            data-testid="thesauri-form-item-name"
            label={<Translate>Title</Translate>}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...register('label', { required: true })}
            // hasErrors={!!errors.label}
          />
          {groups && (
            <Select
              id="item-group"
              data-testid="thesauri-form-item-group"
              label={<Translate>Group</Translate>}
              // eslint-disable-next-line react/jsx-props-no-spreading
              {...register('groupId')}
              value={parentGroup ? parentGroup._id : undefined}
              disabled
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
    );
  };

  const closeSidepanel = () => {
    reset({ newValues: [{ label: '' }] });
    setShowSidepanel(false);
  };

  const addIdsBeforeSubmit = (
    item: { newValues: LocalThesaurusValueSchema[] } | LocalThesaurusValueSchema
  ) => {
    if (!value) {
      const items = (item as { newValues: LocalThesaurusValueSchema[] }).newValues
        .filter(newValue => newValue.label !== '')
        .map(valueWithoutId => {
          return { ...valueWithoutId, _id: uniqueID() };
        });
      submit(items);
      reset({ newValues: [{ label: '' }] });
      return;
    }
    if (parentGroup) {
      (item as LocalThesaurusValueSchema).groupId = parentGroup._id;
    }
    const itemToSubmit = item as LocalThesaurusValueSchema;
    submit([{ label: itemToSubmit.label, _id: itemToSubmit._id, groupId: itemToSubmit.groupId }]);
    reset({ newValues: [{ label: '' }] });
  };

  return (
    <Sidepanel
      isOpen={showSidepanel}
      withOverlay
      closeSidepanelFunction={closeSidepanel}
      title={value ? <Translate>Edit item</Translate> : <Translate>Add item</Translate>}
    >
      <form
        onSubmit={handleSubmit(addIdsBeforeSubmit)}
        className="flex flex-col h-full"
        id="value-thesauri-form"
      >
        <Sidepanel.Body>
          {!value && (
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
          {renderInputs()}
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
export type { LocalThesaurusValueSchema };
