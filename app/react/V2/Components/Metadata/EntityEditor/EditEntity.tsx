import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useAtomValue } from 'jotai';
import { t } from '#app/I18N/index.js';
import { Entity } from '#V2/api/entities/types.js';
import { templatesAtom } from '#app/V2/atoms/templatesAtom.js';
import { TextField, SelectField } from './Components/index.js';

type EditEntityFormValues = {
  title: Entity['title'];
  template: Entity['template'];
};

type EditEntityProps = {
  formId: string;
  entity?: Entity;
  onSave?: (editedEntity?: Entity) => void;
  disabled?: boolean;
};

const EditEntity = ({ formId, entity, onSave, disabled = false }: EditEntityProps) => {
  const templates = useAtomValue(templatesAtom);
  const availableTemplates = templates.map(template => {
    const label = t(template._id, template.name, null, false);
    return {
      label,
      searchLabel: label,
      value: template._id,
    };
  });

  const formContext = useForm<EditEntityFormValues>({
    values: {
      title: entity?.title ?? '',
      template: entity?.template ?? '',
    },
  });

  const { handleSubmit } = formContext;

  const submit = handleSubmit(values => {
    if (!entity) {
      onSave?.(undefined);
    } else {
      onSave?.({
        ...entity,
        title: values.title || entity.title,
        template: values.template || entity.template,
      });
    }
  });

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <FormProvider {...formContext}>
      <form id={formId} onSubmit={submit} className="flex flex-col gap-4 h-full w-full">
        <TextField<EditEntityFormValues>
          context="System"
          label="Title"
          field="title"
          registerOptions={{ required: true }}
          disabled={disabled}
        />

        <SelectField<EditEntityFormValues>
          context="System"
          label="Template"
          field="template"
          registerOptions={{ required: true }}
          disabled={disabled}
          singleSelect
          options={availableTemplates}
        />
      </form>
    </FormProvider>
  );
};

export { EditEntity };
