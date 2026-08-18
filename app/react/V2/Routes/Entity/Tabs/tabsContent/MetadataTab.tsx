import React, { useCallback, useEffect, useMemo } from 'react';
import { useRevalidator } from 'react-router';
import { useAtomValue } from 'jotai';
import type { Entity } from '#V2/api/entities/types.js';
import { mediaContextFromTemplate } from '#shared/entitySave/mediaContext.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { MetadataRecord } from '#V2/Components/Metadata/MetadataRecord.js';
import {
  EditEntity,
  apiValidationsToEditEntityErrors,
} from '#V2/Components/Metadata/EntityEditor/index.js';
import {
  useMetadataEditing,
  useEntityOverlay,
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

const MetadataTab = ({ entity, host }: MetadataTabProps) => {
  const { entities } = useServices();
  const templates = useAtomValue(templatesAtom);
  const { setEntity } = useEntityContext();
  const { language, mainDocument } = useEntityLanguage();
  const {
    isEditing,
    isSaving,
    saveError,
    editErrors,
    form,
    formId,
    formMountHost,
    mediaUpload,
    setSaveError,
    setEditErrors,
    setIsDirty,
    finishEditing,
    registerCancelEdit,
    tryBeginSave,
    endSave,
  } = useMetadataEditing();
  const {
    documentPdfSelection,
    draftPropertySelections,
    upsertPropertySelection,
    clearPropertySelection,
    setDocumentPdfSelection,
    setPdfSelectionMenuOpen,
  } = useDocumentPdf();
  const { openEntityOverlayTarget } = useEntityOverlay();
  const revalidator = useRevalidator();
  const showEditor = isEditing && formMountHost === host;

  const setPdfSelection = useCallback(
    (selection: Parameters<PdfFillHost['setDocumentPdfSelection']>[0]) => {
      setDocumentPdfSelection(selection);
    },
    [setDocumentPdfSelection]
  );
  const setPdfMenuOpen = useCallback(
    (open: boolean) => {
      setPdfSelectionMenuOpen(open);
    },
    [setPdfSelectionMenuOpen]
  );

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
      setDocumentPdfSelection: setPdfSelection,
      setPdfSelectionMenuOpen: setPdfMenuOpen,
    }),
    [
      clearPropertySelection,
      documentPdfSelection,
      draftPropertySelections,
      isEditing,
      language,
      mainDocument?.language,
      mainDocument?.propertySelections,
      setPdfMenuOpen,
      setPdfSelection,
      upsertPropertySelection,
    ]
  );

  useEffect(() => {
    if (!showEditor) return undefined;
    return registerCancelEdit(() => {
      setEditErrors(undefined);
    });
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
    entityLoaderCache.invalidateEntity(entity.sharedId);
    setEntity(
      entityIncludesRelationships(saved) || !entity.relations
        ? saved
        : { ...saved, relations: entity.relations }
    );
    await revalidator.revalidate();
    finishEditing();
  };
  const onSave = async (editedEntity: EntitySaveInput) => {
    const abortController = tryBeginSave();
    if (!abortController) return;

    setSaveError(undefined);
    setEditErrors(undefined);

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
      endSave();
    }
  };

  return (
    <div
      className={`h-full min-h-0 min-w-0 flex-1 overflow-y-auto py-3 pb-8 ${
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
