/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';

// @ts-expect-error TS(2307): Cannot find module '../../I18N/index.js' or its co... Remove this comment to see the full error message
import { Translate } from '../../I18N/index.js';
// @ts-expect-error TS(2307): Cannot find module '../../V2/Components/Forms.js' ... Remove this comment to see the full error message
import { InputField } from '../../V2/Components/Forms.js';
import { useForm } from 'react-hook-form';
// @ts-expect-error TS(2307): Cannot find module '../../V2/Components/UI.js' or ... Remove this comment to see the full error message
import { Button, Card } from '../../V2/Components/UI.js';
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
