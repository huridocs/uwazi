import React from 'react';
import CheckCircleIcon from '@heroicons/react/20/solid/CheckCircleIcon';
import { Translate } from 'app/I18N';
import { InputField } from 'app/V2/Components/Forms';
import { Button, Card } from 'app/V2/Components/UI';
import { SubmitHandler, useFieldArray, useForm } from 'react-hook-form';
import { ThesaurusValueSchema } from 'shared/types/thesaurusType';
import uniqueID from 'shared/uniqueID';

interface GroupFormProps {
  closePanel: () => void;
  value?: ThesaurusValueSchema;
  submit: SubmitHandler<ThesaurusValueSchema>;
}

const GroupForm = ({ submit, closePanel, value }: GroupFormProps) => {
  const {
    watch,
    control,
    setValue,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ThesaurusValueSchema & { groupId: string }>({
    mode: 'onSubmit',
    defaultValues: value || { label: '', values: [{ label: '', id: uniqueID() }], id: uniqueID() },
  });

  const { fields } = useFieldArray({ control, name: 'values' });

  const curateBeforeSubmit = (tValue: ThesaurusValueSchema) => {
    delete tValue.id;
    const filteredValues = tValue.values
      ?.filter(fValue => fValue.label && fValue.label !== '')
      .map(mValue => {
        delete mValue.id;
        return mValue;
      });
    submit({ label: tValue.label, id: tValue.id, values: filteredValues });
  };

  return (
    <div className="relative h-full">
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
            Each item created will live inside this group. Once you type the first item name, a new
            item form will appear underneath it, so you can keep on adding as many as you want.
          </Translate>
        </div>
      </div>
      <form onSubmit={handleSubmit(curateBeforeSubmit)} id="menu-form">
        <Card title={<Translate>Group</Translate>}>
          <div className="flex flex-col gap-4">
            <InputField
              id="item-name"
              data-testid="thesauri-form-item-name"
              label={<Translate>Name</Translate>}
              {...register('label', { required: true })}
              hasErrors={!!errors.label}
              clearFieldAction={() => setValue('label', '')}
            />
          </div>
        </Card>
        {fields.map((_, index) => (
          <Card title={<Translate>Item</Translate>}>
            <div className="flex flex-col gap-4">
              <InputField
                id="item-name"
                data-testid="thesauri-form-item-name"
                label={<Translate>Name</Translate>}
                {...register(`values.${index}.label`)}
              />
              <InputField
                id="item-group"
                data-testid="thesauri-form-item-group"
                label={<Translate>Group</Translate>}
                value={watch('label')}
                disabled
              />
            </div>
          </Card>
        ))}
      </form>
      <div className="absolute bottom-0 flex w-full gap-2">
        <Button
          styling="light"
          onClick={closePanel}
          className="grow"
          data-testid="menu-form-cancel"
        >
          <Translate>Cancel</Translate>
        </Button>
        <Button className="grow" type="submit" form="menu-form" data-testid="menu-form-submit">
          <Translate>Add</Translate>
        </Button>
      </div>
    </div>
  );
};

export { GroupForm };
