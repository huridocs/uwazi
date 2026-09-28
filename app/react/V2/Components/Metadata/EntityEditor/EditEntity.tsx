import React, { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAtomValue } from 'jotai';
import { useFormState, useWatch } from 'react-hook-form';
import { t } from '#app/I18N/index.js';
import {
  currentAndTranslationMetadata,
  filterReferencedPendingAttachments,
} from '#shared/entitySave/mediaMetadata.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { thesauriAtom } from '#V2/atoms/thesauriAtom.js';
import { settingsAtom } from '#V2/atoms/index.js';
import { MultiselectListOption } from '../../Forms/index.js';
import { TitleField, IconField, TemplateField } from './Components/index.js';
import { useInstalledEntityLanguages } from './Components/useInstalledEntityLanguages.js';
import { EditEntityPropertyField } from './EditEntityPropertyField.js';
import type { EditEntityProps } from './editEntityTypes.js';
import {
  mapTemplateProperty,
  type EditEntityFormValues,
} from './functions/buildEditEntityDefaultValues.js';
import {
  buildEditEntitySaveInput,
  planSharedMetadataSync,
  isEntityEditorDirty,
} from './functions/editEntityMetadata.js';
import { rekeyEditEntityLanguage } from './functions/entityTranslations.js';
import {
  applyEditEntityErrors,
  getFirstEditEntityErrorPath,
  type EditEntityErrors,
} from './functions/editEntityErrors.js';
import { findFirstErrorPath, focusAndScrollToInvalidField } from './functions/focusInvalidField.js';
import {
  getGroupedRelationshipSyncPairs,
  groupRelationshipProperties,
} from './functions/relationshipGrouping.js';
import { sortByTemplatePropertyOrder } from '../sortByTemplatePropertyOrder.js';
import {
  defaultRelationshipLookup,
  mergeRelationshipLookupOptions,
  type RelationshipLookupSearchArgs,
} from './functions/relationshipFieldHelpers.js';
import { usePdfFill } from './Components/EntityPdfFill.js';
import { TranslationServiceAvailabilityProvider } from './Components/TranslationServiceAvailability.js';

/* eslint-disable max-statements, max-lines -- orchestrator: watches, sync effects, submit, lookup cache */
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
  mainDocumentId,
}: EditEntityProps) => {
  const templates = useAtomValue(templatesAtom);
  const thesauri = useAtomValue(thesauriAtom);
  const settings = useAtomValue(settingsAtom);
  const { current: language } = useInstalledEntityLanguages();
  const { handleSubmit, control, getValues, setValue, reset, setError, watch } = formContext;
  const { isDirty } = useFormState({ control });
  const selectedTemplate = useWatch({ control, name: 'template' });
  const previousTemplateRef = useRef(selectedTemplate);
  const [metadataEpoch, setMetadataEpoch] = useState(0);
  const { draftPropertySelections } = usePdfFill();
  const languageRef = useRef(language);

  useEffect(() => {
    onDirtyChange?.(isEntityEditorDirty(isDirty, draftPropertySelections.length));
  }, [draftPropertySelections.length, isDirty, onDirtyChange]);

  const availableTemplates = useMemo(
    () =>
      templates.map(template => {
        const name = t(template._id, template.name, null, false);
        return { searchLabel: name, value: template._id, color: template.color };
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

  useEffect(() => {
    const previous = languageRef.current;
    if (!previous || !language || previous === language) return;
    languageRef.current = language;
    reset(
      rekeyEditEntityLanguage({
        values: getValues(),
        fromLanguage: previous,
        toLanguage: language,
        metadataProperties,
      }),
      { keepDirty: true }
    );
  }, [getValues, language, metadataProperties, reset]);
  const displayProperties = useMemo(
    () =>
      sortByTemplatePropertyOrder(
        groupRelationshipProperties(metadataProperties),
        activeTemplate?.properties
      ),
    [activeTemplate?.properties, metadataProperties]
  );
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

  const removePendingAttachmentIfUnused = useCallback(
    (fileLocalID: string) => {
      const stillReferenced =
        filterReferencedPendingAttachments(
          [{ fileLocalID }],
          currentAndTranslationMetadata(getValues('metadata'), getValues('translations')),
          mediaPropertyNames
        ).length > 0;
      if (!stillReferenced) removePendingAttachment(fileLocalID);
    },
    [getValues, mediaPropertyNames, removePendingAttachment]
  );

  const isMetadataReady = metadataProperties.every(
    property => metadataEpoch >= 0 && getValues('metadata')?.[property.name] !== undefined
  );

  useEffect(() => {
    const templateChanged = previousTemplateRef.current !== selectedTemplate;
    previousTemplateRef.current = selectedTemplate;
    const plan = planSharedMetadataSync({
      currentValues: getValues(),
      metadataProperties,
      entityMetadata: entity?.metadata,
      options: { force: templateChanged },
    });
    if (plan.type === 'noop') {
      setMetadataEpoch(value => value + 1);
      return;
    }
    reset(plan.values, plan.options);
    setMetadataEpoch(value => value + 1);
  }, [entity?.metadata, getValues, metadataProperties, reset, selectedTemplate]);

  useEffect(() => {
    const pairs = getGroupedRelationshipSyncPairs(displayProperties);
    if (!pairs.length) return undefined;
    const mains = new Set(pairs.map(pair => `metadata.${pair.mainName}`));
    const sync = () => {
      pairs.forEach(({ mainName, otherNames }) => {
        const sourceValues = getValues(`metadata.${mainName}`) ?? [];
        otherNames.forEach(name => {
          if (
            JSON.stringify(getValues(`metadata.${name}`) ?? []) !== JSON.stringify(sourceValues)
          ) {
            setValue(`metadata.${name}`, sourceValues);
          }
        });
      });
    };
    const { unsubscribe } = watch((_values, info) => {
      if (info.name && mains.has(info.name)) sync();
    });
    sync();
    return unsubscribe;
  }, [displayProperties, getValues, setValue, watch]);

  const relationshipLookupCache = useMemo(
    () => new Map<string, MultiselectListOption[]>(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entity?._id, activeTemplate?._id]
  );

  const relationshipLookupSearch = useCallback(
    async (args: RelationshipLookupSearchArgs) =>
      Promise.resolve(mergeRelationshipLookupOptions({ ...args, cache: relationshipLookupCache })),
    [relationshipLookupCache]
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
      await onSave?.(
        buildEditEntitySaveInput({
          entity,
          values,
          metadataProperties,
          pendingAttachments,
          mediaPropertyNames,
          currentLanguage: language ?? entity?.language ?? 'en',
          languages: settings.languages ?? [],
          mainDocumentId,
          draftPropertySelections,
        })
      );
    },
    invalidErrors => focusAndScrollToInvalidField(findFirstErrorPath(invalidErrors))
  );

  return (
    <TranslationServiceAvailabilityProvider>
      <form
        id={formId}
        onSubmit={submit}
        className="flex w-full min-w-0 flex-col gap-3 font-sans text-base text-ink"
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
              <div key={property._id} className="flex flex-col gap-1">
                <EditEntityPropertyField
                  property={property}
                  disabled={disabled}
                  activeTemplateId={activeTemplate?._id ?? ''}
                  thesauri={thesauri}
                  templates={templates}
                  metadataProperties={metadataProperties}
                  entityMetadata={entity?.metadata}
                  entitySharedId={entity?.sharedId ?? 'NEW_ENTITY'}
                  entityAttachments={entityAttachments}
                  pendingAttachments={pendingAttachments}
                  registerPendingAttachment={registerPendingAttachment}
                  removePendingAttachmentIfUnused={removePendingAttachmentIfUnused}
                  onEditSource={onEditSource}
                  relationshipLookup={relationshipLookup}
                  relationshipLookupSearch={relationshipLookupSearch}
                />
              </div>
            ))}
          </Fragment>
        )}
      </form>
    </TranslationServiceAvailabilityProvider>
  );
};

export { EditEntity };
export type { EditEntityErrors, EditEntityFormValues, EditEntityProps };
