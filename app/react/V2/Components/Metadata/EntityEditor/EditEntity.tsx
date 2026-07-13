/* eslint-disable max-lines, max-statements */
import React, { useEffect, useMemo } from 'react';
import { FieldErrors, FormProvider, useForm } from 'react-hook-form';
import { useAtomValue } from 'jotai';
import { t, Translate } from '#app/I18N/index.js';
import { ClientThesaurus } from '#app/apiResponseTypes.js';
import { Entity } from '#V2/api/entities/types.js';
import type { EntitySaveInput } from '#V2/services/contracts/EntitiesService.js';
import { lookup as lookupEntities } from '#V2/api/search/index.js';
import { scrollIntoView } from '#V2/helpers/scrollIntoView.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { thesauriAtom } from '#V2/atoms/thesauriAtom.js';
import type { MetadataValue } from '#V2/formatters/types.js';
import {
  TextField,
  TitleField,
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
  NestedField,
  MediaField,
  PreviewField,
  DerivedRelationshipsSection,
} from './Components/index.js';
import { EMPTY_ICON, hasEntityIcon, type EntityIcon } from './Components/IconField.js';
import { MultiselectListOption } from '../../Forms/index.js';
import {
  formatMetadataForForm,
  type FormMetadataProperty,
} from './functions/formatMetadataForForm.js';
import { toMetadataObjectSchema } from './functions/toMetadataObjectSchema.js';
import {
  applyEditEntityErrors,
  getFirstEditEntityErrorPath,
  type EditEntityErrors,
} from './functions/editEntityErrors.js';
import { useEntityMediaUpload } from './hooks/useEntityMediaUpload.js';

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
  onSave?: (editedEntity: EntitySaveInput) => void | Promise<void>;
  disabled?: boolean;
  errors?: EditEntityErrors;
  relationshipLookup?: (params: {
    search: string;
    template?: string;
    limit?: number;
  }) => Promise<{ value: string; label: string }[]>;
};

type Properties = FormMetadataProperty;
type DisplayProperty = Properties & {
  groupedRelationshipNames?: string[];
};

const mapTemplateProperty = (property: {
  _id?: string;
  name: string;
  type: Properties['type'];
  label: string;
  required?: boolean;
  content?: string;
  relationType?: string;
  style?: string;
  inherit?: { type?: Properties['inheritedType'] };
}): Properties => ({
  _id: String(property._id ?? property.name),
  type: property.type,
  name: property.name,
  label: property.label,
  required: property.required,
  content: property.content,
  relationType: property.relationType,
  style: property.style,
  inherited: Boolean(property.inherit),
  inheritedType: property.inherit?.type,
});

const DEFAULT_RELATIONSHIP_LOOKUP_LIMIT = 50;

const defaultRelationshipLookup = async ({
  search,
  template,
  limit = DEFAULT_RELATIONSHIP_LOOKUP_LIMIT,
}: {
  search: string;
  template?: string;
  limit?: number;
}): Promise<{ value: string; label: string }[]> => {
  const response = await lookupEntities({
    entityTitle: search,
    template,
    limit,
  });

  if (!response || !('rows' in response) || !Array.isArray(response.rows)) {
    return [];
  }

  return response.rows
    .filter(row => typeof row.sharedId === 'string')
    .map(row => ({
      value: row.sharedId as string,
      label: (row.title as string) || (row.sharedId as string),
    }));
};

const groupRelationshipProperties = (properties: Properties[]): DisplayProperty[] => {
  const groupedProperties = new Map<string, DisplayProperty>();

  properties.forEach(property => {
    if (property.type !== 'relationship' || property.inherited) {
      groupedProperties.set(property._id, property);
      return;
    }

    const groupKey = `${property.content ?? ''}::${property.relationType ?? ''}`;
    const existing = groupedProperties.get(groupKey);

    if (!existing) {
      groupedProperties.set(groupKey, {
        ...property,
        groupedRelationshipNames: [property.name],
      });
      return;
    }

    groupedProperties.set(groupKey, {
      ...existing,
      label: `${existing.label} / ${property.label}`,
      required: Boolean(existing.required || property.required),
      groupedRelationshipNames: [
        ...(existing.groupedRelationshipNames ?? [existing.name]),
        property.name,
      ],
    });
  });

  return [...groupedProperties.values()];
};

const findFirstErrorPath = (
  errors: FieldErrors<EditEntityFormValues>,
  currentPath = ''
): string | undefined => {
  for (const [key, value] of Object.entries(errors)) {
    if (value) {
      const nextPath = currentPath ? `${currentPath}.${key}` : key;

      if (typeof value === 'object' && value !== null) {
        const maybeFieldError = value as { ref?: unknown; message?: unknown; type?: unknown };
        if (maybeFieldError.ref || maybeFieldError.message || maybeFieldError.type) {
          return nextPath;
        }

        const nestedPath = findFirstErrorPath(value as FieldErrors<EditEntityFormValues>, nextPath);
        if (nestedPath) {
          return nestedPath;
        }
      }
    }
  }

  return undefined;
};

const escapeCssAttributeValue = (value: string) =>
  value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

const focusAndScrollToInvalidField = (path?: string) => {
  if (!path || typeof document === 'undefined') {
    return;
  }

  const escapedPath = escapeCssAttributeValue(path);
  const fieldElement =
    document.getElementById(path) ||
    document.querySelector<HTMLElement>(`[name="${escapedPath}"]`) ||
    document.querySelector<HTMLElement>(`[id^="${escapedPath}"]`);

  if (!fieldElement) {
    return;
  }

  scrollIntoView(fieldElement, { behavior: 'smooth', block: 'center' });

  if ('focus' in fieldElement && typeof fieldElement.focus === 'function') {
    fieldElement.focus();
  } else {
    fieldElement
      .querySelector<HTMLElement>('input, textarea, button, [tabindex]:not([tabindex="-1"])')
      ?.focus();
  }

  const originalTransition = fieldElement.style.transition;
  const originalBoxShadow = fieldElement.style.boxShadow;
  fieldElement.style.transition = 'box-shadow 180ms ease';
  fieldElement.style.boxShadow = '0 0 0 3px var(--color-theme-control-error-ring)';
  window.setTimeout(() => {
    fieldElement.style.boxShadow = originalBoxShadow;
    fieldElement.style.transition = originalTransition;
  }, 900);
};

const formatMetadataForEntity = (
  metadata: EditEntityFormValues['metadata'],
  metadataProperties: Properties[],
  originalMetadata?: Entity['metadata']
): Entity['metadata'] => {
  const syncedMetadata = { ...metadata };

  groupRelationshipProperties(metadataProperties)
    .filter(
      property =>
        property.type === 'relationship' &&
        property.groupedRelationshipNames &&
        property.groupedRelationshipNames.length > 1
    )
    .forEach(property => {
      const [mainName, ...otherNames] = property.groupedRelationshipNames ?? [];
      const sourceValues = syncedMetadata[mainName] ?? [];

      otherNames.forEach(name => {
        syncedMetadata[name] = sourceValues;
      });
    });

  return metadataProperties.reduce<NonNullable<Entity['metadata']>>((acc, property) => {
    if (property.inherited) {
      acc[property.name] = [...(originalMetadata?.[property.name] ?? [])];
      return acc;
    }

    acc[property.name] = (syncedMetadata[property.name] ?? []).map(toMetadataObjectSchema);
    return acc;
  }, {});
};

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

const EditEntity = ({
  formId,
  entity,
  onSave,
  disabled = false,
  errors,
  relationshipLookup = defaultRelationshipLookup,
}: EditEntityProps) => {
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
          ?.properties?.map(mapTemplateProperty) || [],
        entity?.metadata
      ),
    },
  });

  const { handleSubmit, watch, reset, getValues, setValue, setError } = formContext;
  const selectedTemplate = watch('template');
  const metadata = watch('metadata');

  const activeTemplate = useMemo(
    () =>
      templates.find(template => template._id === selectedTemplate) ||
      templates.find(template => template._id === entity?.template),
    [entity?.template, selectedTemplate, templates]
  );

  const metadataProperties = useMemo(
    () => activeTemplate?.properties?.map(mapTemplateProperty) || [],
    [activeTemplate]
  );
  const derivedProperties = useMemo(
    () => metadataProperties.filter(property => property.inherited),
    [metadataProperties]
  );
  const displayProperties = useMemo(
    () => groupRelationshipProperties(metadataProperties.filter(property => !property.inherited)),
    [metadataProperties]
  );
  const firstEditableRelationshipId = displayProperties.find(
    property => property.type === 'relationship'
  )?._id;

  const {
    allAttachments: entityAttachments,
    pendingAttachments,
    registerPendingAttachment,
  } = useEntityMediaUpload(entity);

  const isMetadataReady = metadataProperties.every(
    property => metadata?.[property.name] !== undefined
  );

  useEffect(() => {
    reset({
      ...getValues(),
      metadata: formatMetadataForForm(metadataProperties, entity?.metadata),
    });
  }, [entity?.metadata, getValues, metadataProperties, reset]);

  useEffect(() => {
    displayProperties
      .filter(
        property =>
          property.type === 'relationship' &&
          Array.isArray(property.groupedRelationshipNames) &&
          property.groupedRelationshipNames.length > 1
      )
      .forEach(property => {
        const [mainName, ...otherNames] = property.groupedRelationshipNames ?? [];
        const sourceValues = metadata?.[mainName] ?? [];

        otherNames.forEach(name => {
          const targetValues = metadata?.[name] ?? [];
          if (JSON.stringify(targetValues) !== JSON.stringify(sourceValues)) {
            setValue(`metadata.${name}`, sourceValues);
          }
        });
      });
  }, [displayProperties, metadata, setValue]);

  const relationshipLookupCache = useMemo(
    () => new Map<string, MultiselectListOption[]>(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entity?._id, activeTemplate?._id]
  );

  const relationshipLookupSearch = async (
    property: DisplayProperty,
    selectedValues: MetadataValue[],
    lookedUpOptions: MultiselectListOption[] = [],
    includeCachedOptions = true
  ): Promise<MultiselectListOption[]> => {
    const cacheKey = `${property.content ?? ''}::${property.relationType ?? ''}`;
    const cachedOptions = includeCachedOptions ? (relationshipLookupCache.get(cacheKey) ?? []) : [];
    const selectedOptions = selectedValues
      .filter(value => value?.value)
      .map(value => {
        const valueId = String(value.value);
        const cached = cachedOptions.find(option => option.value === valueId);
        const lookedUp = lookedUpOptions.find(option => option.value === valueId);
        const label =
          (typeof value.label === 'string' ? value.label : undefined) ||
          (typeof cached?.label === 'string' ? cached.label : undefined) ||
          (typeof lookedUp?.label === 'string' ? lookedUp.label : undefined) ||
          valueId;

        return {
          label,
          searchLabel: label.toLowerCase(),
          value: valueId,
        };
      });

    const merged = [...selectedOptions, ...cachedOptions, ...lookedUpOptions].filter(
      (option, index, options) => options.findIndex(other => other.value === option.value) === index
    );

    if (includeCachedOptions) {
      relationshipLookupCache.set(cacheKey, merged);
    }

    return merged;
  };

  useEffect(() => {
    if (!errors) {
      return;
    }

    applyEditEntityErrors(setError, errors, metadataProperties);

    const firstErrorPath = getFirstEditEntityErrorPath(errors, metadataProperties);
    if (firstErrorPath) {
      requestAnimationFrame(() => focusAndScrollToInvalidField(firstErrorPath));
    }
  }, [errors, metadataProperties, setError]);

  const submit = handleSubmit(
    async values => {
      if (!entity) return;
      const formattedMetadata = formatMetadataForEntity(
        values.metadata,
        metadataProperties,
        entity?.metadata
      );
      const entityToSave = {
        ...entity,
        title: values.title || entity.title,
        template: values.template || entity.template,
        icon: (values.showIcon ? values.icon : EMPTY_ICON) as Entity['icon'],
        metadata: formattedMetadata,
        attachments: [...(entity.attachments ?? []), ...pendingAttachments],
      };
      await onSave?.(entityToSave);
    },
    invalidErrors => {
      const firstErrorPath = findFirstErrorPath(invalidErrors);
      focusAndScrollToInvalidField(firstErrorPath);
    }
  );

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <FormProvider {...formContext}>
      <form
        id={formId}
        onSubmit={submit}
        className="flex w-full flex-col gap-3 font-sans text-base text-ink"
        data-testid="entity-edit-form"
      >
        <TitleField<EditEntityFormValues>
          context="System"
          label="Title"
          field="title"
          registerOptions={{ required: true }}
          disabled={disabled}
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
          displayProperties.map(property => {
            if (property.inherited) {
              return undefined;
            }

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
              const fieldName = property.groupedRelationshipNames?.[0] ?? property.name;
              const inheritColumnLabels =
                property.groupedRelationshipNames && property.groupedRelationshipNames.length > 1
                  ? property.groupedRelationshipNames.slice(1).map(name => {
                      const groupedProperty = metadataProperties.find(
                        metadataProperty => metadataProperty.name === name
                      );
                      return groupedProperty?.label ?? name;
                    })
                  : [];
              return (
                <>
                  {property._id === firstEditableRelationshipId ? (
                    <h3
                      key={`relationships-heading-${property._id}`}
                      className="pt-2 text-xs font-semibold uppercase tracking-wide text-ink-tertiary"
                    >
                      <Translate>Relationships</Translate>
                    </h3>
                  ) : null}
                  <RelationshipField<EditEntityFormValues>
                    label={property.label}
                    field={`metadata.${fieldName}`}
                    registerOptions={{ required: property.required }}
                    disabled={disabled}
                    targetTemplateId={property.content}
                    relationTypeId={property.relationType}
                    inheritColumnLabels={inheritColumnLabels}
                    lookupSearch={async search => {
                      const selectedValues = metadata?.[fieldName] ?? [];
                      const lookedUp = await relationshipLookup({
                        search,
                        template: property.content,
                        limit: DEFAULT_RELATIONSHIP_LOOKUP_LIMIT,
                      });
                      const lookedUpOptions = lookedUp.map(option => ({
                        label: option.label,
                        searchLabel: option.label,
                        value: option.value,
                      }));
                      return relationshipLookupSearch(
                        property,
                        selectedValues,
                        lookedUpOptions.filter(
                          option =>
                            !search.trim() ||
                            option.searchLabel.toLowerCase().includes(search.trim().toLowerCase())
                        ),
                        !search.trim()
                      );
                    }}
                    key={property._id}
                  />
                </>
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

            if (property.type === 'nested') {
              return (
                <NestedField<EditEntityFormValues>
                  context={activeTemplate?._id ?? ''}
                  label={property.label}
                  field={`metadata.${property.name}`}
                  registerOptions={{ required: property.required }}
                  disabled={disabled}
                  key={property._id}
                />
              );
            }

            if (property.type === 'image') {
              return (
                <MediaField<EditEntityFormValues>
                  context={activeTemplate?._id ?? ''}
                  label={property.label}
                  field={`metadata.${property.name}.0.value`}
                  mode="image"
                  imageStyle={
                    property.style === 'contain' || property.style === 'cover'
                      ? property.style
                      : 'fill'
                  }
                  registerOptions={{ required: property.required }}
                  disabled={disabled}
                  attachments={entityAttachments}
                  pendingAttachments={pendingAttachments}
                  entitySharedId={entity?.sharedId ?? 'NEW_ENTITY'}
                  onRegisterPendingAttachment={registerPendingAttachment}
                  key={property._id}
                />
              );
            }

            if (property.type === 'media') {
              return (
                <MediaField<EditEntityFormValues>
                  context={activeTemplate?._id ?? ''}
                  label={property.label}
                  field={`metadata.${property.name}.0.value`}
                  mode="media"
                  registerOptions={{ required: property.required }}
                  disabled={disabled}
                  attachments={entityAttachments}
                  pendingAttachments={pendingAttachments}
                  entitySharedId={entity?.sharedId ?? 'NEW_ENTITY'}
                  onRegisterPendingAttachment={registerPendingAttachment}
                  key={property._id}
                />
              );
            }

            if (property.type === 'preview') {
              return (
                <PreviewField
                  context={activeTemplate?._id ?? ''}
                  label={property.label}
                  value={metadata?.[property.name]?.[0]?.value as string | undefined}
                  key={property._id}
                />
              );
            }

            return undefined;
          })}
        {entity && derivedProperties.length > 0 ? (
          <DerivedRelationshipsSection entity={entity} properties={derivedProperties} />
        ) : null}
      </form>
    </FormProvider>
  );
};

export { EditEntity };
export type { EditEntityErrors };
