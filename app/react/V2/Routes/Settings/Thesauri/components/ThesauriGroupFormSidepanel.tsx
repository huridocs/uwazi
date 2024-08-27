/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect } from 'react';
import { SubmitHandler, useFieldArray, useForm } from 'react-hook-form';
import { isEmpty, last } from 'lodash';
import CheckCircleIcon from '@heroicons/react/20/solid/CheckCircleIcon';
import { Translate } from 'app/I18N';
import { InputField } from 'app/V2/Components/Forms';
import { Button, Card, Sidepanel } from 'app/V2/Components/UI';
import uniqueID from 'shared/uniqueID';
import { ThesaurusRow } from './TableComponents';
import { emptyThesaurus } from '../helpers';

interface ThesauriGroupFormSidepanelProps {
  closePanel: () => void;
  value?: ThesaurusRow;
  submit: SubmitHandler<ThesaurusRow>;
  showSidepanel: boolean;
}

const ThesauriGroupFormSidepanel = ({
  submit,
  closePanel,
  value,
  showSidepanel,
}: ThesauriGroupFormSidepanelProps) => {
  const {
    watch,
    reset,
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ThesaurusRow>({
    mode: 'onSubmit',
    defaultValues: value,
  });

  const editMode = value !== undefined && value.label !== '';
  const { append, fields } = useFieldArray({
    control,
    name: 'subRows',
    keyName: 'rowId',
    rules: { minLength: 2 },
  });

  useEffect(() => {
    if (value) {
      reset(value);
    } else {
      reset(emptyThesaurus());
    }
  }, [reset, value]);

  useEffect(() => {
    const subscription: any = watch((formData): void => {
      const { subRows } = formData;
      if (!isEmpty(last(subRows)?.label)) {
        append({ label: '', rowId: uniqueID() }, { shouldFocus: false });
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, append]);

  const curateBeforeSubmit = (tValue: ThesaurusRow) => {
    const filteredValues = (tValue.subRows || [])
      .filter(fValue => !isEmpty(fValue.label))
      .map(item => ({ ...item, groupId: tValue.rowId }));

    submit({
      ...tValue,
      subRows: filteredValues,
    });
    closePanel();
  };

  const renderItem = () =>
    fields.map((localValue, index) => (
      <div className="mt-2" key={localValue.rowId}>
        <Card title={<Translate>Item</Translate>}>
          <div className="flex flex-col gap-4">
            <InputField
              id="item-name"
              data-testid="thesauri-form-item-name"
              label={<Translate>Title</Translate>}
              {...register(`subRows.${index}.label`, { required: index < fields.length - 1 })}
            />
          </div>
          {errors.subRows?.root?.type === 'minLength' && index === 0 && (
            <Translate className="text-error-700">This field is required</Translate>
          )}
        </Card>
      </div>
    ));

  return (
    <Sidepanel
      isOpen={showSidepanel}
      withOverlay
      closeSidepanelFunction={closePanel}
      title={editMode ? <Translate>Edit group</Translate> : <Translate>Add group</Translate>}
    >
      <form
        onSubmit={handleSubmit(curateBeforeSubmit)}
        id="group-thesauri-form"
        className="flex flex-col h-full"
      >
        <Sidepanel.Body>
          {value && value.label === '' && (
            <div className="p-4 mb-4 border rounded-md shadow-sm border-gray-50 bg-primary-100 text-primary-700">
              <div className="flex items-center w-full gap-1 text-base font-semibold">
                <div className="w-5 h-5 text-sm">
                  <CheckCircleIcon />
                </div>
                <Translate>Adding a group and its items.</Translate>
              </div>
              <div className="force-ltr">
                <Translate>You can add one or many items in this form.</Translate>
                <br />
                <Translate translationKey="thesauri new group desc">
                  Each item created will live inside this group. Once you type the first item name,
                  a new item form will appear underneath it, so you can keep on adding as many as
                  you want.
                </Translate>
              </div>
            </div>
          )}
          <Card title={<Translate>Group</Translate>}>
            <div className="flex flex-col gap-4">
              <InputField
                id="group-name"
                data-testid="thesauri-form-item-name"
                label={<Translate>Name</Translate>}
                {...register('label', { required: true })}
                hasErrors={!!errors.label}
              />
            </div>
            {errors.label?.type === 'required' && (
              <Translate className="text-error-700">This field is required</Translate>
            )}
          </Card>
          {renderItem()}
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
              {!editMode ? <Translate>Add group</Translate> : <Translate>Edit group</Translate>}
            </Button>
          </div>
        </Sidepanel.Footer>
      </form>
    </Sidepanel>
  );
};

export { ThesauriGroupFormSidepanel };
