/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';

import { Translate } from 'app/I18N';
import { InputField } from 'app/V2/Components/Forms';
import { useForm } from 'react-hook-form';
import { ClientRelationshipType } from 'app/apiResponseTypes';
import { Button, Card } from 'app/V2/Components/UI';

interface FormProps {
  closePanel: () => void;
  relationtype?: ClientRelationshipType;
  submit: (formValues: ClientRelationshipType) => void;
}

const Form = ({ closePanel, submit, relationtype }: FormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientRelationshipType>({
    values: relationtype,
    mode: 'onSubmit',
  });

  return (
    <div className="relative h-full">
      <form onSubmit={handleSubmit(submit)} id="relationship-type-form">
        <Card title={<Translate>Relationship Type</Translate>}>
          <div className="flex flex-col gap-4">
            <InputField
              id="link-title"
              data-testid="relationship-type-form-name"
              label={<Translate>Name</Translate>}
              {...register('name', { required: true })}
              hasErrors={!!errors.name}
            />
          </div>
        </Card>
      </form>
      <div className="absolute bottom-0 flex w-full gap-2">
        <Button
          styling="light"
          onClick={closePanel}
          className="grow"
          data-testid="relationship-type-form-cancel"
        >
          <Translate>Cancel</Translate>
        </Button>
        <Button
          className="grow"
          type="submit"
          form="relationship-type-form"
          data-testid="relationship-type-form-submit"
        >
          {relationtype?.name ? <Translate>Update</Translate> : <Translate>Add</Translate>}
        </Button>
      </div>
    </div>
  );
};

export { Form };
