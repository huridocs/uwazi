import React, { Fragment, useEffect, useMemo, useRef } from 'react';
import { useAtomValue } from 'jotai';
import { useWatch } from 'react-hook-form';
import { t } from '#app/I18N/index.js';
import { extractUploadIdFromMediaValue } from '#shared/entitySave/mediaMetadata.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { thesauriAtom } from '#V2/atoms/thesauriAtom.js';
import type { MetadataValue } from '#V2/formatters/types.js';
import { MultiselectListOption } from '../../Forms/index.js';
import { TitleField, IconField, TemplateField } from './Components/index.js';
import { EditEntityPropertyField } from './EditEntityPropertyField.js';
import type { EditEntityProps } from './editEntityTypes.js';
import {
  mapTemplateProperty,
  type EditEntityFormValues,
} from './functions/buildEditEntityDefaultValues.js';
import {
  buildEditEntitySaveInput,
  planSharedMetadataSync,
} from './functions/editEntityMetadata.js';
import {
  applyEditEntityErrors,
  getFirstEditEntityErrorPath,
  type EditEntityErrors,
} from './functions/editEntityErrors.js';
import { findFirstErrorPath, focusAndScrollToInvalidField } from './functions/focusInvalidField.js';
import {
  getGroupedRelationshipSyncPairs,
  groupRelationshipProperties,
  type DisplayProperty,
} from './functions/relationshipGrouping.js';
import {
  defaultRelationshipLookup,
  mergeRelationshipLookupOptions,
} from './functions/relationshipFieldHelpers.js';

/* eslint-disable max-statements -- orchestrator: watches, sync effects, submit, lookup cache */
const EditEntity = ({
  formId,
  entity,
  form: formContext,
  mediaUpload,
  onSave,
  disabled = false,
  errors,
  onDirtyChange,
  onEditSource,
  relationshipLookup = defaultRelationshipLookup,
}: EditEntityProps) => {
  const templates = useAtomValue(templatesAtom);
  const thesauri = useAtomValue(thesauriAtom);
  const { handleSubmit, control, getValues, setValue, reset, setError, formState } = formContext;
  const selectedTemplate = useWatch({ control, name: 'template' });
  const metadata = useWatch({ control, name: 'metadata' });
  const previousTemplateRef = useRef(selectedTemplate);

  useEffect(() => {
    onDirtyChange?.(formState.isDirty);
  }, [formState.isDirty, onDirtyChange]);

  const availableTemplates = useMemo(
    () =>
      templates.map(template => {
        const label = t(template._id, template.name, null, false);
        return { label, searchLabel: label, value: template._id };
      }),
    [templates]
  );

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
  const displayProperties = useMemo(
    () => groupRelationshipProperties(metadataProperties),
    [metadataProperties]
  );
  const firstEditableRelationshipId = displayProperties.find(
    property => property.type === 'relationship'
  )?._id;

  const {
    entityAttachments,
    pendingAttachments,
    registerPendingAttachment,
    removePendingAttachment,
  } = mediaUpload;

  const mediaPropertyNames = useMemo(
    () =>
      new Set(
        metadataProperties
          .filter(property => property.type === 'image' || property.type === 'media')
          .map(property => property.name)
      ),
    [metadataProperties]
  );

  const removePendingAttachmentIfUnused = (fileLocalID: string) => {
    const formMetadata = getValues('metadata');
    const stillReferenced = [...mediaPropertyNames].some(name => {
      const rawValue = formMetadata?.[name]?.[0]?.value;
      return (
        typeof rawValue === 'string' && extractUploadIdFromMediaValue(rawValue) === fileLocalID
      );
    });
    if (!stillReferenced) removePendingAttachment(fileLocalID);
  };

  const isMetadataReady = metadataProperties.every(
    property => metadata?.[property.name] !== undefined
  );

  useEffect(() => {
    const templateChanged = previousTemplateRef.current !== selectedTemplate;
    previousTemplateRef.current = selectedTemplate;
    const plan = planSharedMetadataSync(getValues(), metadataProperties, entity?.metadata, {
      force: templateChanged,
    });
    if (plan.type === 'noop') return;
    reset(plan.values, plan.options);
  }, [entity?.metadata, getValues, metadataProperties, reset, selectedTemplate]);

  useEffect(() => {
    getGroupedRelationshipSyncPairs(displayProperties).forEach(({ mainName, otherNames }) => {
      const sourceValues = metadata?.[mainName] ?? [];
      otherNames.forEach(name => {
        if (JSON.stringify(metadata?.[name] ?? []) !== JSON.stringify(sourceValues)) {
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
  ) =>
    Promise.resolve(
      mergeRelationshipLookupOptions({
        property,
        selectedValues,
        lookedUpOptions,
        cache: relationshipLookupCache,
        includeCachedOptions,
      })
    );

  useEffect(() => {
    if (!errors) return;
    applyEditEntityErrors(setError, errors, metadataProperties);
    const firstErrorPath = getFirstEditEntityErrorPath(errors, metadataProperties);
    if (firstErrorPath) {
      requestAnimationFrame(() => focusAndScrollToInvalidField(firstErrorPath));
    }
  }, [errors, metadataProperties, setError]);

  const submit = handleSubmit(
    async values => {
      if (!entity) return;
      await onSave?.(
        buildEditEntitySaveInput({
          entity,
          values,
          metadataProperties,
          pendingAttachments,
          mediaPropertyNames,
        })
      );
    },
    invalidErrors => focusAndScrollToInvalidField(findFirstErrorPath(invalidErrors))
  );

  return (
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
      {isMetadataReady && (
        <Fragment key={selectedTemplate}>
          {displayProperties.map(property => (
            <EditEntityPropertyField
              key={property._id}
              property={property}
              disabled={disabled}
              activeTemplateId={activeTemplate?._id ?? ''}
              thesauri={thesauri}
              templates={templates}
              metadataProperties={metadataProperties}
              metadata={metadata}
              entityMetadata={entity?.metadata}
              entitySharedId={entity?.sharedId ?? 'NEW_ENTITY'}
              firstEditableRelationshipId={firstEditableRelationshipId}
              entityAttachments={entityAttachments}
              pendingAttachments={pendingAttachments}
              registerPendingAttachment={registerPendingAttachment}
              removePendingAttachmentIfUnused={removePendingAttachmentIfUnused}
              onEditSource={onEditSource}
              relationshipLookup={relationshipLookup}
              relationshipLookupSearch={relationshipLookupSearch}
            />
          ))}
        </Fragment>
      )}
    </form>
  );
};

export { EditEntity };
export type { EditEntityErrors, EditEntityFormValues, EditEntityProps };
