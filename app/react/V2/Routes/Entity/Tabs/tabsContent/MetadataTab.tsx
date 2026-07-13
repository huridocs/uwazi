import React, { useEffect, useRef, useState } from 'react';
import { useRevalidator } from 'react-router';
import type { Entity } from '#V2/api/entities/types.js';
import { MetadataDisplay } from '#V2/Components/Metadata/MetadataDisplay.js';
import { EditEntity, type EditEntityErrors } from '#V2/Components/Metadata/EntityEditor/index.js';
import { apiValidationsToEditEntityErrors } from '#V2/Components/Metadata/EntityEditor/functions/editEntityErrors.js';
import { useMetadataEditing } from '#V2/Routes/Entity/Components/context/index.js';
import { entityLoaderCache } from '#V2/Routes/Entity/EntityLoaderCache.js';
import { useServices } from '#V2/services/index.js';
import type { EntitySaveInput } from '#V2/services/index.js';

type MetadataTabProps = {
  entity: Entity;
};

const MetadataTab = ({ entity }: MetadataTabProps) => {
  const { entities } = useServices();
  const {
    isEditing,
    isSaving,
    saveError,
    setIsEditing,
    setIsSaving,
    setSaveError,
    registerCancelEdit,
  } = useMetadataEditing();
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

  const onSave = async (editedEntity: EntitySaveInput) => {
    if (savingRef.current) return;

    savingRef.current = true;
    setIsSaving(true);
    setSaveError(undefined);
    setEditErrors(undefined);
    abortRef.current = new AbortController();

    try {
      const [data, error] = await entities.upsert(editedEntity, {
        signal: abortRef.current.signal,
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
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-auto px-4 py-3 pb-8" data-testid="metadata-edit-scroll">
        {!isEditing && <MetadataDisplay entity={entity} />}
        {isEditing && (
          <div className="space-y-3">
            {saveError && (
              <p className="text-sm text-red-600" role="alert">
                {saveError}
              </p>
            )}
            <EditEntity
              formId="edit-entity-form"
              entity={entity}
              onSave={onSave}
              disabled={isSaving}
              errors={editErrors}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export { MetadataTab };
