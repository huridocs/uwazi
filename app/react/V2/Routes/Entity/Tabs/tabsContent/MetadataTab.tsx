import React, { useEffect, useRef } from 'react';
import { useRevalidator } from 'react-router';
import type { Entity } from '#V2/api/entities/types.js';
import { MetadataDisplay } from '#V2/Components/Metadata/MetadataDisplay.js';
import { EditEntity } from '#V2/Components/Metadata/EntityEditor/index.js';
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

  useEffect(() => {
    mountedRef.current = true;
    const unregister = registerCancelEdit(() => {
      abortRef.current?.abort();
      abortRef.current = null;
      savingRef.current = false;
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

  const onSave = async (editedEntity: EntitySaveInput) => {
    if (savingRef.current) return;

    savingRef.current = true;
    setIsSaving(true);
    setSaveError(undefined);
    abortRef.current = new AbortController();

    try {
      const [data, error] = await entities.upsert(editedEntity, {
        signal: abortRef.current.signal,
      });
      if (error) {
        if (error.kind === 'cancelled') return;
        if (mountedRef.current) setSaveError(error.detail ?? error.message);
        return;
      }
      if (!data) return;

      entityLoaderCache.invalidateEntity(entity.sharedId);
      await revalidator.revalidate();
      if (mountedRef.current) setIsEditing(false);
    } finally {
      abortRef.current = null;
      savingRef.current = false;
      if (mountedRef.current) setIsSaving(false);
    }
  };

  return (
    <div className="h-full min-h-0 flex-1 overflow-y-auto py-3">
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
          />
        </>
      )}
    </div>
  );
};

export { MetadataTab };
