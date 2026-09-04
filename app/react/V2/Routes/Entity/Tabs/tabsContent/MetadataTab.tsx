import React, { useCallback, useEffect, useMemo } from 'react';
import { useRevalidator } from 'react-router';
import { useAtomValue } from 'jotai';
import type { Entity } from '#V2/api/entities/types.js';
import { mediaContextFromTemplate } from '#shared/entitySave/mediaContext.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import type { Template } from '#app/apiResponseTypes.js';
import { MetadataRecord } from '#V2/Components/Metadata/MetadataRecord.js';
import {
  EditEntity,
  apiValidationsToEditEntityErrors,
} from '#V2/Components/Metadata/EntityEditor/index.js';
import {
  useMetadataEditing,
  useEntityOverlayActions,
  useEntityContext,
  useEntityLanguage,
  useDocumentPdf,
  type MetadataEditingHost,
} from '#V2/Routes/Entity/Components/context/index.js';
import {
  entityIncludesRelationships,
  entityLoaderCache,
} from '#V2/Routes/Entity/EntityLoaderCache.js';
import { useServices } from '#V2/services/index.js';
import type { EntitySaveInput } from '#V2/services/index.js';
import {
  PdfFillProvider,
  type PdfFillHost,
} from '#V2/Components/Metadata/EntityEditor/Components/EntityPdfFill.js';

type MetadataTabProps = {
  entity: Entity;
  host: MetadataEditingHost;
};

type MetadataEditingState = ReturnType<typeof useMetadataEditing>;

const persistSavedEntity = async ({
  entity,
  saved,
  setEntity,
  revalidator,
  finishEditing,
}: {
  entity: Entity;
  saved: Entity;
  setEntity: ReturnType<typeof useEntityContext>['setEntity'];
  revalidator: ReturnType<typeof useRevalidator>;
  finishEditing: () => void;
}) => {
  entityLoaderCache.invalidateEntity(entity.sharedId);
  setEntity(
    entityIncludesRelationships(saved) || !entity.relations
      ? saved
      : { ...saved, relations: entity.relations }
  );
  await revalidator.revalidate();
  finishEditing();
};

const reportUpsertError = (
  error: NonNullable<Awaited<ReturnType<ReturnType<typeof useServices>['entities']['upsert']>>[1]>,
  setEditErrors: MetadataEditingState['setEditErrors'],
  setSaveError: MetadataEditingState['setSaveError']
) => {
  if (error.kind === 'cancelled') return;
  const fieldErrors = apiValidationsToEditEntityErrors(error.validations);
  setEditErrors(fieldErrors);
  if (!fieldErrors) setSaveError(error.detail ?? error.message);
};

const saveEditedEntity = async ({
  editedEntity,
  abortController,
  templates,
  entities,
  entity,
  setSaveError,
  setEditErrors,
  setEntity,
  revalidator,
  finishEditing,
}: {
  editedEntity: EntitySaveInput;
  abortController: AbortController;
  templates: Template[];
  entities: ReturnType<typeof useServices>['entities'];
  entity: Entity;
  setSaveError: MetadataEditingState['setSaveError'];
  setEditErrors: MetadataEditingState['setEditErrors'];
  setEntity: ReturnType<typeof useEntityContext>['setEntity'];
  revalidator: ReturnType<typeof useRevalidator>;
  finishEditing: () => void;
}) => {
  const template = templates.find(t => t._id === editedEntity.template);
  if (!template) {
    setSaveError('Template not found');
    return;
  }
  const [data, error] = await entities.upsert(editedEntity, {
    signal: abortController.signal,
    saveMediaContext: mediaContextFromTemplate(template),
  });
  if (error) {
    reportUpsertError(error, setEditErrors, setSaveError);
    return;
  }
  if (!data) return;
  await persistSavedEntity({ entity, saved: data, setEntity, revalidator, finishEditing });
};

const useMetadataTabSave = (entity: Entity, editing: MetadataEditingState) => {
  const { entities } = useServices();
  const templates = useAtomValue(templatesAtom);
  const { setEntity } = useEntityContext();
  const revalidator = useRevalidator();
  const { setSaveError, setEditErrors, finishEditing, tryBeginSave, endSave } = editing;

  return useCallback(
    async (editedEntity: EntitySaveInput) => {
      const abortController = tryBeginSave();
      if (!abortController) return;
      setSaveError(undefined);
      setEditErrors(undefined);
      try {
        await saveEditedEntity({
          editedEntity,
          abortController,
          templates,
          entities,
          entity,
          setSaveError,
          setEditErrors,
          setEntity,
          revalidator,
          finishEditing,
        });
      } finally {
        endSave();
      }
    },
    [
      endSave,
      entities,
      entity,
      finishEditing,
      revalidator,
      setEditErrors,
      setEntity,
      setSaveError,
      templates,
      tryBeginSave,
    ]
  );
};

const MetadataTab = ({ entity, host }: MetadataTabProps) => {
  const { language, mainDocument } = useEntityLanguage();
  const editing = useMetadataEditing();
  const {
    isEditing,
    isSaving,
    saveError,
    editErrors,
    form,
    formId,
    formMountHost,
    mediaUpload,
    setIsDirty,
    registerCancelEdit,
    setEditErrors,
  } = editing;
  const {
    documentPdfSelection,
    draftPropertySelections,
    upsertPropertySelection,
    clearPropertySelection,
    setDocumentPdfSelection,
    setPdfSelectionMenuOpen,
  } = useDocumentPdf();
  const { openEntityOverlayTarget } = useEntityOverlayActions();
  const showEditor = isEditing && formMountHost === host;
  const onSave = useMetadataTabSave(entity, editing);

  const pdfFill: PdfFillHost = useMemo(
    () => ({
      isEditing,
      language,
      documentLanguage: mainDocument?.language,
      savedPropertySelections: mainDocument?.propertySelections,
      documentPdfSelection,
      draftPropertySelections,
      upsertPropertySelection,
      clearPropertySelection,
      setDocumentPdfSelection,
      setPdfSelectionMenuOpen,
    }),
    [
      clearPropertySelection,
      documentPdfSelection,
      draftPropertySelections,
      isEditing,
      language,
      mainDocument?.language,
      mainDocument?.propertySelections,
      setDocumentPdfSelection,
      setPdfSelectionMenuOpen,
      upsertPropertySelection,
    ]
  );

  useEffect(() => {
    if (!showEditor) return undefined;
    return registerCancelEdit(() => {
      setEditErrors(undefined);
    });
  }, [registerCancelEdit, setEditErrors, showEditor]);

  return (
    <div
      className={`min-h-0 min-w-0 flex-1 overflow-y-auto py-3 pb-8 ${
        host === 'side' ? 'px-3' : 'px-4'
      }`}
    >
      {!showEditor && <MetadataRecord entity={entity} onOpenEntity={openEntityOverlayTarget} />}
      {showEditor && (
        <>
          {saveError && (
            <p className="mb-3 text-sm text-red-600" role="alert">
              {saveError}
            </p>
          )}
          <PdfFillProvider value={pdfFill}>
            <EditEntity
              formId={formId}
              form={form}
              entity={entity}
              mediaUpload={mediaUpload}
              onSave={onSave}
              disabled={isSaving}
              errors={editErrors}
              onDirtyChange={setIsDirty}
              mainDocumentId={mainDocument?._id}
              onEditSource={(sharedId, title, templateId) =>
                openEntityOverlayTarget({
                  sharedId,
                  title,
                  templateId: templateId ?? '',
                })
              }
            />
          </PdfFillProvider>
        </>
      )}
    </div>
  );
};

export { MetadataTab };
