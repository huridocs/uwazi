/* eslint-disable max-lines, max-statements */
import React, { useEffect, useMemo } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useAtomValue } from 'jotai';
import { t } from '#app/I18N/index.js';
import { ClientThesaurus } from '#app/apiResponseTypes.js';
import { Entity } from '#V2/api/entities/types.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { thesauriAtom } from '#V2/atoms/thesauriAtom.js';
import { resolvePropertyMetadataValues } from '#V2/formatters/index.js';
import type { MetadataValue } from '#V2/formatters/types.js';
import {
  TextField,
  IconField,
  SelectField,
  TemplateField,
  MultiselectField,
  DateField,
  DateRangeField,
  MultidateField,
  MultiDateRangeField,
  LinkField,
  GeolocationField,
  RelationshipField,
  MarkdownField,
} from './Components/index.js';
import { MultiselectListOption } from '../../Forms/index.js';
import {
  formatMetadataForForm,
  type FormMetadataProperty,
} from './functions/formatMetadataForForm.js';
import { toMetadataObjectSchema } from './functions/toMetadataObjectSchema.js';
import { EMPTY_ICON, hasEntityIcon, type EntityIcon } from './functions/iconSelectUtils.js';

type EditEntityFormValues = {
  title: Entity['title'];
  template: Entity['template'];
  showIcon: boolean;
  icon: EntityIcon;
  metadata: Record<string, MetadataValue[]>;
};

type EditEntityProps = {
  formId: string;
  entity?: Entity;
  onSave?: (editedEntity?: Entity) => void;
  disabled?: boolean;
};

type Properties = FormMetadataProperty;

const formatMetadataForEntity = (
  metadata: EditEntityFormValues['metadata'],
  metadataProperties: Properties[]
): Entity['metadata'] =>
  metadataProperties.reduce<NonNullable<Entity['metadata']>>((acc, property) => {
    acc[property.name] = (metadata[property.name] ?? []).map(toMetadataObjectSchema);
    return acc;
  }, {});

const thesaurusToOptions = (
  thesauri: ClientThesaurus[],
  property: Properties
): MultiselectListOption[] =>
  thesauri
    .find(thesaurus => thesaurus._id === property.content)
    ?.values.map(value => ({
      label: value.label,
      searchLabel: value.label,
      value: value.id || value.label,
      items: value.values?.map(child => ({
        label: child.label,
        searchLabel: child.label,
        value: child.id || child.label,
      })),
    })) || [];

const relationshipToOptions = (
  property: Properties,
  metadata?: Entity['metadata']
): MultiselectListOption[] => {
  const relationshipValues = resolvePropertyMetadataValues(property, metadata);

  if (!Array.isArray(relationshipValues)) {
    return [];
  }

  return relationshipValues
    .filter(value => value?.value && value.label && value.authorized !== false)
    .map(value => ({
      label: value.label as string,
      searchLabel: value.label as string,
      value: value.value as string,
    }));
};

const EditEntity = ({ formId, entity, onSave, disabled = false }: EditEntityProps) => {
  const templates = useAtomValue(templatesAtom);
  const thesauri = useAtomValue(thesauriAtom);

  const availableTemplates = useMemo(
    () =>
      templates.map(template => {
        const label = t(template._id, template.name, null, false);

        return {
          label,
          searchLabel: label,
          value: template._id,
        };
      }),
    [templates]
  );

  const formContext = useForm<EditEntityFormValues>({
    defaultValues: {
      title: entity?.title || '',
      template: entity?.template || '',
      showIcon: hasEntityIcon(entity?.icon),
      icon: entity?.icon ?? EMPTY_ICON,
      metadata: formatMetadataForForm(
        templates
          .find(template => template._id === entity?.template)
          ?.properties?.map(property => ({
            _id: String(property._id ?? property.name),
            type: property.type,
            name: property.name,
            label: property.label,
            required: property.required,
            content: property.content,
          })) || [],
        entity?.metadata
      ),
    },
  });

  const { handleSubmit, watch, reset, getValues } = formContext;
  const selectedTemplate = watch('template');
  const metadata = watch('metadata');

  const activeTemplate = useMemo(
    () =>
      templates.find(template => template._id === selectedTemplate) ||
      templates.find(template => template._id === entity?.template),
    [entity?.template, selectedTemplate, templates]
  );

  const metadataProperties = useMemo(
    () =>
      activeTemplate?.properties?.map(property => ({
        _id: String(property._id ?? property.name),
        type: property.type,
        name: property.name,
        label: property.label,
        required: property.required,
        content: property.content,
      })) || [],
    [activeTemplate]
  );

  const isMetadataReady = metadataProperties.every(
    property => metadata?.[property.name] !== undefined
  );

  useEffect(() => {
    reset({
      ...getValues(),
      metadata: formatMetadataForForm(metadataProperties, entity?.metadata),
    });
  }, [entity?.metadata, getValues, metadataProperties, reset]);

  const submit = handleSubmit(values => {
    if (!entity) {
      onSave?.(undefined);
    } else {
      onSave?.({
        ...entity,
        title: values.title || entity.title,
        template: values.template || entity.template,
        icon: (values.showIcon ? values.icon : EMPTY_ICON) as Entity['icon'],
        metadata: formatMetadataForEntity(values.metadata, metadataProperties),
      });
    }
  });

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <FormProvider {...formContext}>
      <form
        id={formId}
        onSubmit={submit}
        className="flex flex-col gap-6 h-full w-full bg(--color-theme-bg-surface)"
      >
        <TextField<EditEntityFormValues>
          context="System"
          label="Title"
          field="title"
          registerOptions={{ required: true }}
          disabled={disabled}
          type="text"
        />

        <IconField disabled={disabled} />

        <TemplateField<EditEntityFormValues>
          context="System"
          label="Template"
          field="template"
          registerOptions={{ required: true }}
          disabled={disabled}
          options={availableTemplates}
          hideFilters
        />
        {isMetadataReady &&
          metadataProperties.map(property => {
            if (property.type === 'text' || property.type === 'generatedid') {
              return (
                <TextField<EditEntityFormValues>
                  context={activeTemplate?._id ?? ''}
                  label={property.label}
                  field={`metadata.${property.name}.0.value`}
                  registerOptions={{ required: property.required }}
                  disabled={disabled}
                  type="text"
                  key={property._id}
                />
              );
            }

            if (property.type === 'numeric') {
              return (
                <TextField<EditEntityFormValues>
                  context={activeTemplate?._id ?? ''}
                  label={property.label}
                  field={`metadata.${property.name}.0.value`}
                  registerOptions={{ required: property.required }}
                  disabled={disabled}
                  type="number"
                  key={property._id}
                />
              );
            }

            if (property.type === 'select') {
              return (
                <SelectField<EditEntityFormValues>
                  context={property.content || 'System'}
                  label={property.label}
                  field={`metadata.${property.name}`}
                  registerOptions={{ required: property.required }}
                  disabled={disabled}
                  options={thesaurusToOptions(thesauri, property)}
                  hideFilters
                  key={property._id}
                />
              );
            }

            if (property.type === 'multiselect') {
              return (
                <MultiselectField<EditEntityFormValues>
                  context={property.content || 'System'}
                  label={property.label}
                  field={`metadata.${property.name}`}
                  registerOptions={{ required: property.required }}
                  disabled={disabled}
                  options={thesaurusToOptions(thesauri, property)}
                  key={property._id}
                />
              );
            }

            if (property.type === 'relationship') {
              return (
                <RelationshipField<EditEntityFormValues>
                  context={activeTemplate?._id ?? ''}
                  label={property.label}
                  field={`metadata.${property.name}`}
                  registerOptions={{ required: property.required }}
                  disabled={disabled}
                  options={relationshipToOptions(property, entity?.metadata)}
                  key={property._id}
                />
              );
            }

            if (property.type === 'date') {
              return (
                <DateField<EditEntityFormValues>
                  context={activeTemplate?._id ?? ''}
                  label={property.label}
                  field={`metadata.${property.name}.0.value`}
                  registerOptions={{ required: property.required }}
                  disabled={disabled}
                  key={property._id}
                />
              );
            }

            if (property.type === 'daterange') {
              return (
                <DateRangeField<EditEntityFormValues>
                  context={activeTemplate?._id ?? ''}
                  label={property.label}
                  field={`metadata.${property.name}.0.value`}
                  registerOptions={{ required: property.required }}
                  disabled={disabled}
                  key={property._id}
                />
              );
            }

            if (property.type === 'multidate') {
              return (
                <MultidateField<EditEntityFormValues>
                  context={activeTemplate?._id ?? ''}
                  label={property.label}
                  field={`metadata.${property.name}`}
                  registerOptions={{ required: property.required }}
                  disabled={disabled}
                  key={property._id}
                />
              );
            }

            if (property.type === 'multidaterange') {
              return (
                <MultiDateRangeField<EditEntityFormValues>
                  context={activeTemplate?._id ?? ''}
                  label={property.label}
                  field={`metadata.${property.name}`}
                  registerOptions={{ required: property.required }}
                  disabled={disabled}
                  key={property._id}
                />
              );
            }

            if (property.type === 'link') {
              return (
                <LinkField<EditEntityFormValues>
                  context={activeTemplate?._id ?? ''}
                  label={property.label}
                  field={`metadata.${property.name}.0.value`}
                  registerOptions={{ required: property.required }}
                  disabled={disabled}
                  key={property._id}
                />
              );
            }

            if (property.type === 'geolocation') {
              return (
                <GeolocationField<EditEntityFormValues>
                  context={activeTemplate?._id ?? ''}
                  label={property.label}
                  field={`metadata.${property.name}.0.value`}
                  registerOptions={{ required: property.required }}
                  disabled={disabled}
                  key={property._id}
                />
              );
            }

            if (property.type === 'markdown') {
              return (
                <MarkdownField<EditEntityFormValues>
                  context={activeTemplate?._id ?? ''}
                  label={property.label}
                  field={`metadata.${property.name}.0.value`}
                  registerOptions={{ required: property.required }}
                  disabled={disabled}
                  key={property._id}
                />
              );
            }

            if (
              property.type === 'image' ||
              property.type === 'media' ||
              property.type === 'preview'
            ) {
              return <p no-translate="true">Image, media and preview fields not implement yet.</p>;
            }

            return undefined;
          })}
      </form>
    </FormProvider>
  );
};

export { EditEntity };
