import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { Entity } from '#V2/api/entities/types.js';
import { TextField } from './Components/index.js';

type EditEntityProps = {
  formId: string;
  entity?: Entity;
  onSave?: (editedEntity?: Entity) => void;
};

type EditEntityFormValues = {
  title?: string;
};

const EditEntity = ({ formId, entity, onSave }: EditEntityProps) => {
  const formContext = useForm<EditEntityFormValues>({
    values: {
      title: entity?.title ?? '',
    },
  });

  const { handleSubmit } = formContext;

  const submit = handleSubmit(values => {
    if (!onSave) return;
    if (!entity) {
      onSave(undefined);
      return;
    }

    onSave({
      ...entity,
      title: values.title ?? entity.title,
    });
  });

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <FormProvider {...formContext}>
      <form id={formId} onSubmit={submit}>
        <TextField<EditEntityFormValues>
          context="System"
          label="Title"
          field="title"
          registerOptions={{ required: true }}
        />
      </form>
    </FormProvider>
  );
};

export { EditEntity };
