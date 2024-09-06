/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';

import { Translate } from 'app/I18N';
import { InputField } from 'app/V2/Components/Forms';
import { useForm } from 'react-hook-form';
import { Button, Card } from 'app/V2/Components/UI';
import { Relationships } from './TableComponents';

interface FormProps {
  closePanel: () => void;
  relationtype?: Relationships;
  submit: (formValues: Relationships) => void;
  currentTypes: Relationships[];
}

const Form = ({ closePanel, submit, relationtype, currentTypes }: FormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Relationships>({
    values: relationtype,
    mode: 'onSubmit',
  });

  return (
    <div className="relative h-full">
      <form onSubmit={handleSubmit(submit)} id="relationship-type-form">
        <Card title={<Translate>Relationship Type</Translate>}>
          <div className="flex flex-col gap-4">
            <InputField
              id="relationship-type-name"
              data-testid="relationship-type-form-name"
              label={<Translate>Name</Translate>}
              {...register('name', {
                required: true,
                validate: {
                  alreadyExists: value => !currentTypes.some(type => type.name === value),
                },
              })}
              hasErrors={!!errors.name}
              errorMessage={
                errors.name?.type === 'alreadyExists' ? <Translate>Already exists</Translate> : null
              }
            />
          </div>
        </Card>
      </form>
      <div className="flex absolute bottom-0 gap-2 px-4 py-3 w-full">
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
          <Translate>Save</Translate>
        </Button>
      </div>
    </div>
  );
};

export { Form };
