import React, { useMemo } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useAtomValue } from 'jotai';
import { PropertySchema } from '#shared/types/commonTypes.js';
import { t } from '#app/I18N/index.js';
import { Entity } from '#V2/api/entities/types.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { ClientTemplateSchema } from '#V2/shared/types.js';
import { resolvePropertyMetadataValues, toMetadataObjectSchema } from '#V2/formatters/index.js';
import type { MetadataValue } from '#V2/formatters/types.js';
import { TextField, SelectField } from './Components/index.js';
import { MultiselectListOption } from '../../Forms/index.js';

type EditEntityFormValues = {
  title: Entity['title'];
  template: Entity['template'];
  metadata: Record<string, MetadataValue[]>;
};

type EditEntityProps = {
  formId: string;
  entity?: Entity;
  onSave?: (editedEntity?: Entity) => void;
  disabled?: boolean;
};

type Properties = {
  _id: string;
  type: PropertySchema['type'];
  name: string;
  label: string;
  required?: boolean;
};

const formatMetadataForForm = (
  templateProperties: Properties[],
  entityMetadata?: Entity['metadata']
): EditEntityFormValues['metadata'] =>
  templateProperties.reduce<EditEntityFormValues['metadata']>((acc, property) => {
    acc[property.name] = resolvePropertyMetadataValues(property, entityMetadata);
    return acc;
  }, {});

const formatMetadataForEntity = (
  metadata: EditEntityFormValues['metadata'],
  metadataProperties: Properties[]
): Entity['metadata'] =>
  metadataProperties.reduce<NonNullable<Entity['metadata']>>((acc, property) => {
    acc[property.name] = (metadata[property.name] ?? []).map(toMetadataObjectSchema);
    return acc;
  }, {});

const EditEntity = ({ formId, entity, onSave, disabled = false }: EditEntityProps) => {
  const templates = useAtomValue(templatesAtom);

  const { availableTemplates, entityTemplate, metadataProperties } = useMemo(
    () =>
      templates.reduce(
        (
          acc: {
            availableTemplates: MultiselectListOption[];
            entityTemplate: ClientTemplateSchema;
            metadataProperties: Properties[];
          },
          template
        ) => {
          const label = t(template._id, template.name, null, false);

          acc.availableTemplates.push({
            label,
            searchLabel: label,
            value: template._id,
          });

          if (template._id === entity?.template) {
            acc.entityTemplate = template;
            template.properties?.forEach(property => {
              acc.metadataProperties.push({
                _id: String(property._id ?? property.name),
                type: property.type,
                name: property.name,
                label: property.label,
                required: property.required,
              });
            });
          }

          return acc;
        },
        { availableTemplates: [], entityTemplate: templates[0], metadataProperties: [] }
      ),
    [entity, templates]
  );

  const defaultMetadataValues = useMemo(
    () => formatMetadataForForm(metadataProperties, entity?.metadata),
    [entity?.metadata, metadataProperties]
  );

  const formContext = useForm<EditEntityFormValues>({
    values: {
      title: entity?.title ?? '',
      template: entity?.template ?? '',
      metadata: defaultMetadataValues,
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
        metadata: formatMetadataForEntity(values.metadata, metadataProperties),
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
          type="text"
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

        {metadataProperties.map(property => {
          if (property.type === 'text' || property.type === 'numeric') {
            return (
              <TextField<EditEntityFormValues>
                context={entityTemplate._id}
                label={property.label}
                field={`metadata.${property.name}.0.value`}
                registerOptions={{ required: property.required }}
                disabled={disabled}
                type={property.type === 'text' ? property.type : 'number'}
              />
            );
          }
          return undefined;
        })}
      </form>
    </FormProvider>
  );
};

export { EditEntity };
