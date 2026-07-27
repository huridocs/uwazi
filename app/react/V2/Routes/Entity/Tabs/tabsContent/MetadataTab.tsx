import React, { useEffect, useRef } from 'react';
import { useRevalidator } from 'react-router';
import { useAtomValue } from 'jotai';
import type { Entity } from '#V2/api/entities/types.js';
import { mediaContextFromTemplate } from '#shared/entitySave/mediaContext.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { MetadataDisplay } from '#V2/Components/Metadata/MetadataDisplay.js';
import { EditEntity } from '#V2/Components/Metadata/EntityEditor/index.js';
import { apiValidationsToEditEntityErrors } from '#V2/Components/Metadata/EntityEditor/functions/editEntityErrors.js';
import {
  useMetadataEditing,
  useEntityOverlay,
  useEntityContext,
  useEntityLanguage,
  type MetadataEditingHost,
} from '#V2/Routes/Entity/Components/context/index.js';
import { entityLoaderCache } from '#V2/Routes/Entity/EntityLoaderCache.js';
import { useServices } from '#V2/services/index.js';
import type { EntitySaveInput } from '#V2/services/index.js';

type MetadataTabProps = {
  entity: Entity;
  host: MetadataEditingHost;
};

const MetadataTab = ({ entity, host }: MetadataTabProps) => {
  const { entities } = useServices();
  const templates = useAtomValue(templatesAtom);
  const { setEntity } = useEntityContext();
  const { language } = useEntityLanguage();
  const {
    isEditing,
    isSaving,
    saveError,
    editErrors,
    form,
    formId,
    formMountHost,
    mediaUpload,
    setIsSaving,
    setIsDirty,
    setSaveError,
    setEditErrors,
    finishEditing,
    registerCancelEdit,
    beginSaveAbort,
    clearSaveAbort,
  } = useMetadataEditing();
  const { openEntityOverlayTarget } = useEntityOverlay();
  const revalidator = useRevalidator();
  const savingRef = useRef(false);
  const showEditor = isEditing && formMountHost === host;

  useEffect(() => {
    if (!showEditor) return undefined;

    const unregister = registerCancelEdit(() => {
      savingRef.current = false;
      setEditErrors(undefined);
    });

    return unregister;
  }, [showEditor, registerCancelEdit, setEditErrors]);

  const handleUpsertError = (
    error: NonNullable<Awaited<ReturnType<typeof entities.upsert>>[1]>
  ) => {
    if (error.kind === 'cancelled') return;

    const fieldErrors = apiValidationsToEditEntityErrors(error.validations);
    setEditErrors(fieldErrors);
    if (!fieldErrors) setSaveError(error.detail ?? error.message);
  };

  const completeSave = async (saved: Entity) => {
    const savedLanguage = saved.language || language;
    entityLoaderCache.invalidateEntity(entity.sharedId);
    entityLoaderCache.setEntity(entity.sharedId, savedLanguage, saved);
    setEntity(saved);
    await revalidator.revalidate();
    finishEditing();
  };

  // eslint-disable-next-line max-statements
  const onSave = async (editedEntity: EntitySaveInput) => {
    if (savingRef.current) return;

    savingRef.current = true;
    setIsSaving(true);
    setSaveError(undefined);
    setEditErrors(undefined);
    const abortController = beginSaveAbort();

    try {
      const template = templates.find(t => t._id === editedEntity.template);
      if (!template) {
        setSaveError('Template not found');
        return;
      }
      const saveMediaContext = mediaContextFromTemplate(template);
      const [data, error] = await entities.upsert(editedEntity, {
        signal: abortController.signal,
        saveMediaContext,
      });
      if (error) {
        handleUpsertError(error);
        return;
      }
      if (!data) return;

      await completeSave(data);
    } finally {
      clearSaveAbort();
      savingRef.current = false;
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full min-h-0 flex-1 overflow-y-auto px-4 py-3">
      {!showEditor && <MetadataDisplay entity={entity} />}
      {showEditor && (
        <>
          {saveError && (
            <p className="mb-3 text-sm text-red-600" role="alert">
              {saveError}
            </p>
          )}
          <EditEntity
            formId={formId}
            form={form}
            entity={entity}
            mediaUpload={mediaUpload}
            onSave={onSave}
            disabled={isSaving}
            errors={editErrors}
            onDirtyChange={setIsDirty}
            onEditSource={(sharedId, title, templateId) =>
              openEntityOverlayTarget({
                sharedId,
                title,
                templateId: templateId ?? '',
              })
            }
          />
        </>
      )}
    </div>
  );
};

export { MetadataTab };
