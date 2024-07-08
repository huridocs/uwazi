import React, { useEffect } from 'react';
import CheckCircleIcon from '@heroicons/react/20/solid/CheckCircleIcon';
import { Translate } from 'app/I18N';
import { InputField } from 'app/V2/Components/Forms';
import { Button, Card, Sidepanel } from 'app/V2/Components/UI';
import { SubmitHandler, useFieldArray, useForm } from 'react-hook-form';
import uniqueID from 'shared/uniqueID';
import { FormThesauriValue } from './ThesauriValueFormSidepanel';

interface ThesauriGroupFormSidepanelProps {
  closePanel: () => void;
  value?: FormThesauriValue;
  submit: SubmitHandler<FormThesauriValue>;
  showSidepanel: boolean;
}

const ThesauriGroupFormSidepanel = ({
  submit,
  closePanel,
  value,
  showSidepanel,
}: ThesauriGroupFormSidepanelProps) => {
  const defaultValues: FormThesauriValue = {
    label: '',
    values: [{ label: '', _id: `temp_${uniqueID()}` }],
    _id: `temp_${uniqueID()}`,
  };
  const {
    watch,
    reset,
    control,
    setValue,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormThesauriValue>({
    mode: 'onSubmit',
    defaultValues: value,
  });

  const { append, fields } = useFieldArray({ control, name: 'values', keyName: 'tempId' });

  useEffect(() => {
    if (value) {
      reset(value);
    } else {
      reset(defaultValues);
    }
  }, [value]);

  useEffect(() => {
    const subscription: any = watch((formData): void => {
      const values = formData.values;
      // @ts-ignore
      if (Boolean(values.length) && values[values.length - 1].label !== '') {
        // @ts-ignore
        append({ label: '', _id: `temp_${uniqueID()}` }, { shouldFocus: false });
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, append]);

  const curateBeforeSubmit = (tValue: FormThesauriValue) => {
    const filteredValues = tValue.values?.filter(fValue => fValue.label && fValue.label !== '');

    submit({
      _id: tValue._id,
      ...(tValue?.id && { id: tValue.id }),
      label: tValue.label,
      values: filteredValues,
    });
    reset(defaultValues);
    closePanel();
  };

  const renderItem = () =>
    fields.map((localValue, index) => (
      <div className="mt-2" key={localValue.tempId}>
        <Card title={<Translate>Item</Translate>}>
          <div className="flex flex-col gap-4">
            <InputField
              id="item-name"
              data-testid="thesauri-form-item-name"
              label={<Translate>Title</Translate>}
              {...register(`values.${index}.label`)}
            />
          </div>
        </Card>
      </div>
    ));

  return (
    <Sidepanel
      isOpen={showSidepanel}
      withOverlay
      closeSidepanelFunction={closePanel}
      title={
        value && value.label !== '' ? (
          <Translate>Edit group</Translate>
        ) : (
          <Translate>Add group</Translate>
        )
      }
    >
      <form
        onSubmit={handleSubmit(curateBeforeSubmit)}
        id="group-thesauri-form"
        className="flex flex-col h-full"
      >
        <Sidepanel.Body>
          {value && value.label === '' && (
            <div className="p-4 mb-4 rounded-md border border-gray-50 shadow-sm bg-primary-100 text-primary-700">
              <div className="flex gap-1 items-center w-full text-base font-semibold">
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
                clearFieldAction={() => setValue('label', '')}
              />
            </div>
          </Card>
          {renderItem()}
        </Sidepanel.Body>
        <Sidepanel.Footer className="bottom-0 px-4 py-3">
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

export { ThesauriGroupFormSidepanel };
