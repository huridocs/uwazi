import React, { useEffect } from 'react';
import CheckCircleIcon from '@heroicons/react/20/solid/CheckCircleIcon';
import { Translate } from 'app/I18N';
import { InputField } from 'app/V2/Components/Forms';
import { Button, Card, Sidepanel } from 'app/V2/Components/UI';
import { SubmitHandler, useFieldArray, useForm } from 'react-hook-form';
import uniqueID from 'shared/uniqueID';
import { ClientThesaurusValueSchema } from 'app/apiResponseTypes';

interface ThesauriGroupFormSidepanelProps {
  closePanel: () => void;
  value?: ClientThesaurusValueSchema;
  submit: SubmitHandler<ClientThesaurusValueSchema>;
  showSidepanel: boolean;
}

const ThesauriGroupFormSidepanel = ({
  submit,
  closePanel,
  value,
  showSidepanel,
}: ThesauriGroupFormSidepanelProps) => {
  const defaultValues = {
    label: '',
    values: [{ label: '', _id: uniqueID() }],
    _id: uniqueID(),
  };
  const {
    watch,
    reset,
    control,
    setValue,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientThesaurusValueSchema>({
    mode: 'onSubmit',
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
    const subscription = watch(formData => {
      const values = formData.values;
      // @ts-ignore
      if (Boolean(values.length) && values[values.length - 1].label !== '') {
        // @ts-ignore
        append({ label: '' }, { shouldFocus: false });
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, append]);

  const curateBeforeSubmit = (tValue: ClientThesaurusValueSchema) => {
    const filteredValues = tValue.values?.filter(fValue => fValue.label && fValue.label !== '');
    const values = filteredValues?.map(filteredValue => {
      return { ...filteredValue, _id: uniqueID() };
    });
    const group = {
      _id: tValue._id,
      label: tValue.label,
      values,
    };
    submit(group);
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
      title={value ? <Translate>Edit group</Translate> : <Translate>Add group</Translate>}
    >
      <form
        onSubmit={handleSubmit(curateBeforeSubmit)}
        id="group-thesauri-form"
        className="flex flex-col h-full"
      >
        <Sidepanel.Body>
          {!value && (
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
                clearFieldAction={() => setValue('label', '')}
              />
            </div>
          </Card>
          {renderItem()}
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

export { ThesauriGroupFormSidepanel };
