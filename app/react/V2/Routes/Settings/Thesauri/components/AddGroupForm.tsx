import CheckCircleIcon from '@heroicons/react/20/solid/CheckCircleIcon';
import { Translate } from 'app/I18N';
import { InputField, Select } from 'app/V2/Components/Forms';
import { Button, Card } from 'app/V2/Components/UI';
import React from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { ThesaurusSchema, ThesaurusValueSchema } from 'shared/types/thesaurusType';

interface AddItemFormProps {
  closePanel: () => void;
  submit: SubmitHandler<ThesaurusValueSchema & { groupId: string }>;
}

const AddGroupForm = ({ submit, closePanel }: AddItemFormProps) => {
  const {
    register,
    handleSubmit,

    formState: { errors },
  } = useForm<ThesaurusValueSchema & { groupId: string }>({
    mode: 'onSubmit',
  });
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
          <Translate translationKey="thesauri new item desc">
            Once you type the first item name, a new item form will appear underneath it, so you can
            keep on adding as many as you want.
          </Translate>
        </div>
      </div>
      <form onSubmit={handleSubmit(submit)} id="menu-form">
        <Card title={<Translate>Item</Translate>}>
          <div className="flex flex-col gap-4">
            <InputField
              id="item-name"
              data-testid="thesauri-form-item-name"
              label={<Translate>Name</Translate>}
              {...register('label', { required: true })}
              hasErrors={!!errors.label}
            />
          </div>
        </Card>
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

export { AddGroupForm };
