import React, { useEffect, useRef, useState } from 'react';
import { useRevalidator } from 'react-router';
import { useAtomValue } from 'jotai';
import type { Entity } from '#V2/api/entities/types.js';
import { mediaContextFromTemplate } from '#shared/entitySave/mediaContext.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { MetadataDisplay } from '#V2/Components/Metadata/MetadataDisplay.js';
import { EditEntity, type EditEntityErrors } from '#V2/Components/Metadata/EntityEditor/index.js';
import { apiValidationsToEditEntityErrors } from '#V2/Components/Metadata/EntityEditor/functions/editEntityErrors.js';
import {
  useMetadataEditing,
  useEntityOverlay,
} from '#V2/Routes/Entity/Components/context/index.js';
import { entityLoaderCache } from '#V2/Routes/Entity/EntityLoaderCache.js';
import { useServices } from '#V2/services/index.js';
import type { EntitySaveInput } from '#V2/services/index.js';

type MetadataTabProps = {
  entity: Entity;
};

const MetadataTab = ({ entity }: MetadataTabProps) => {
  const { entities } = useServices();
  const templates = useAtomValue(templatesAtom);
  const {
    isEditing,
    isSaving,
    saveError,
    setIsEditing,
    setIsSaving,
    setSaveError,
    registerCancelEdit,
  } = useMetadataEditing();
  const { openEntityOverlayTarget } = useEntityOverlay();
  const revalidator = useRevalidator();
  const savingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);
  const [editErrors, setEditErrors] = useState<EditEntityErrors>();

  useEffect(() => {
    mountedRef.current = true;
    const unregister = registerCancelEdit(() => {
      abortRef.current?.abort();
      abortRef.current = null;
      savingRef.current = false;
      setEditErrors(undefined);
      setSaveError(undefined);
      setIsSaving(false);
      setIsEditing(false);
    });

    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
      unregister();
    };
  }, [registerCancelEdit, setIsEditing, setIsSaving, setSaveError]);

  const handleUpsertError = (
    error: NonNullable<Awaited<ReturnType<typeof entities.upsert>>[1]>
  ) => {
    if (error.kind === 'cancelled' || !mountedRef.current) return;

    const fieldErrors = apiValidationsToEditEntityErrors(error.validations);
    setEditErrors(fieldErrors);
    if (!fieldErrors) setSaveError(error.detail ?? error.message);
  };

  const completeSave = async () => {
    entityLoaderCache.invalidateEntity(entity.sharedId);
    await revalidator.revalidate();
    if (mountedRef.current) setIsEditing(false);
  };

  // eslint-disable-next-line max-statements
  const onSave = async (editedEntity: EntitySaveInput) => {
    if (savingRef.current) return;

    savingRef.current = true;
    setIsSaving(true);
    setSaveError(undefined);
    setEditErrors(undefined);
    abortRef.current = new AbortController();

    try {
      const template = templates.find(t => t._id === editedEntity.template);
      if (!template) {
        if (mountedRef.current) {
          setSaveError('Template not found');
        }
        return;
      }
      const saveMediaContext = mediaContextFromTemplate(template);
      const [data, error] = await entities.upsert(editedEntity, {
        signal: abortRef.current.signal,
        saveMediaContext,
      });
      if (error) {
        handleUpsertError(error);
        return;
      }
      if (!data) return;

      await completeSave();
    } finally {
      abortRef.current = null;
      savingRef.current = false;
      if (mountedRef.current) setIsSaving(false);
    }
  };

  return (
    <div className="h-full min-h-0 flex-1 overflow-y-auto px-4 py-3">
      {!isEditing && <MetadataDisplay entity={entity} />}
      {isEditing && (
        <>
          {saveError && (
            <p className="mb-3 text-sm text-red-600" role="alert">
              {saveError}
            </p>
          )}
          <EditEntity
            formId="edit-entity-form"
            entity={entity}
            onSave={onSave}
            disabled={isSaving}
            errors={editErrors}
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
