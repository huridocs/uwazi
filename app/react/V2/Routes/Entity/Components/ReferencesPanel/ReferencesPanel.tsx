import React, { useState, useCallback, useMemo } from 'react';
import { useRevalidator } from 'react-router';
import { TextSelection } from '@huridocs/react-text-selection-handler';
import { useAtomValue } from 'jotai';
import { LinkIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { Entity, FileType } from '#V2/api/entities/types.js';
import { Panel } from '#V2/Components/Layouts/Panel.js';
import { relationshipTypesAtom, templatesAtom } from '#V2/atoms/index.js';
import { searchByTitle } from '#V2/api/entities/index.js';
import { formatReferences } from '#V2/formatters/index.js';
import { EntityReference } from '#V2/formatters/relationships/types.js';
import { deleteReference, saveTextReference } from '#V2/api/relationships/index.js';
import { ConfirmationModal, BlankState } from '#V2/Components/UI/index.js';
import { referenceToHighlight } from '#V2/Components/PDFViewer/index.js';
import type { ReferenceWithTemplate } from '#V2/Components/References/types.js';
import { entityLoaderCache } from '../../EntityLoaderCache.js';
import { CreateReference } from './CreateReference.js';
import { Reference } from './Reference.js';
import { useReferences, useReferencesActions } from './referencesAtom.js';
import { pdfController } from '../atoms.js';

type ReferencesPanelProps = {
  entity?: Entity;
  mainDocument?: FileType;
};

// eslint-disable-next-line max-statements
const ReferencesPanel = ({ entity, mainDocument }: ReferencesPanelProps) => {
  const [selectedReferenceId, setSelectedReferenceId] = useState<string | null>(null);
  const [referenceToDelete, setReferenceToDelete] = useState<EntityReference | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const relationshipTypes = useAtomValue(relationshipTypesAtom);
  const { createReferenceSelection, createReferenceMode } = useReferences();
  const { setCreateReferenceSelection } = useReferencesActions();
  const revalidator = useRevalidator();
  const mainPdfController = useAtomValue(pdfController);
  const templates = useAtomValue(templatesAtom);
  const references = useMemo<ReferenceWithTemplate[]>(() => {
    if (!entity) return [];
    return formatReferences(entity).map(ref => {
      const template = templates.find(t => t._id === ref.targetEntity.templateId);
      return {
        ...ref,
        targetEntity: {
          ...ref.targetEntity,
          template: {
            _id: ref.targetEntity.templateId,
            name: template?.name || '',
            color: template?.color || '#A4CAFE',
          },
        },
      };
    });
  }, [entity, templates]);

  const lookup = useCallback(
    async (searchString: string) =>
      searchByTitle({
        title: searchString,
        fields: ['title', 'template', 'creationDate', 'sharedId'],
        includeFiles: true,
      }),
    []
  );

  const handleReferenceClick = useCallback(
    (reference: ReferenceWithTemplate) => {
      if (reference._id === selectedReferenceId) {
        setSelectedReferenceId(null);
        mainPdfController?.toggleHighlights([]);
      } else {
        setSelectedReferenceId(reference._id);

        const highlight = referenceToHighlight(reference);
        if (highlight) {
          mainPdfController?.toggleHighlights([highlight]);
        }
      }
    },
    [mainPdfController, selectedReferenceId]
  );

  const handleView = useCallback((_reference: EntityReference) => {
    // TODO: Implement view functionality
  }, []);

  const handleDeleteClick = useCallback((reference: EntityReference) => {
    setReferenceToDelete(reference);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!referenceToDelete?._id || !entity?.sharedId) return;
    setIsDeleting(true);
    try {
      await deleteReference(String(referenceToDelete._id));
      setReferenceToDelete(null);
      if (selectedReferenceId === referenceToDelete._id) {
        setSelectedReferenceId(null);
      }
      entityLoaderCache.invalidateEntity(entity.sharedId);
      await revalidator.revalidate();
    } catch (error) {
      console.error('Error deleting reference:', error);
    } finally {
      setIsDeleting(false);
    }
  }, [referenceToDelete, entity?.sharedId, selectedReferenceId, revalidator]);

  const handleCancelDelete = useCallback(() => {
    if (!isDeleting) setReferenceToDelete(null);
  }, [isDeleting]);

  const handleCancelCreate = useCallback(() => {
    setCreateReferenceSelection(undefined, undefined);
  }, [setCreateReferenceSelection]);

  const handleSaveReference = useCallback(
    async (data: {
      selection: TextSelection;
      targetEntityId: string;
      relationshipType: string;
      targetFileId?: string;
      targetSelection?: TextSelection;
    }) => {
      if (!entity) {
        console.error('Cannot save reference: entity is not available');
        return;
      }

      // Get source file ID (main document)
      const sourceFile = mainDocument;
      if (!sourceFile?._id) {
        console.error('Cannot save reference: source file is not available');
        return;
      }

      if (!data.targetEntityId) {
        console.error('Cannot save reference: targetEntityId is not available');
        return;
      }

      try {
        await saveTextReference({
          sourceEntitySharedId: entity.sharedId,
          sourceFileId: String(sourceFile._id),
          sourceSelection: data.selection,
          targetEntitySharedId: data.targetEntityId,
          relationshipType: data.relationshipType,
          ...(data.targetFileId && { targetFileId: data.targetFileId }),
          ...(data.targetSelection && { targetSelection: data.targetSelection }),
        });

        // Clear the create reference selection after successful save
        setCreateReferenceSelection(undefined, undefined);
        // Invalidate cache and revalidate to refresh the entity data and show the new reference
        entityLoaderCache.invalidateEntity(entity.sharedId);
        await revalidator.revalidate();
      } catch (error) {
        console.error('Error saving reference:', error);
        // TODO: Show error notification to user
      }
    },
    [entity, mainDocument, setCreateReferenceSelection, revalidator]
  );

  // If there's a createReferenceSelection, show the CreateReference component
  if (createReferenceSelection) {
    return (
      <CreateReference
        selection={createReferenceSelection}
        relationshipTypes={relationshipTypes}
        searchFunction={lookup}
        mode={createReferenceMode || 'text'}
        onSave={handleSaveReference}
        onCancel={handleCancelCreate}
      />
    );
  }

  // Otherwise, show the references list
  return (
    <>
      <Panel>
        <Panel.Body className="pr-1">
          <div className="flex h-full flex-col gap-3">
            {references.length > 0 ? (
              references.map((reference, index) => (
                <Reference
                  key={reference._id || `reference-${index}`}
                  reference={reference}
                  isSelected={selectedReferenceId === reference._id}
                  onClick={() => handleReferenceClick(reference)}
                  onView={() => handleView(reference)}
                  onDelete={() => handleDeleteClick(reference)}
                />
              ))
            ) : (
              <BlankState
                icon={
                  <LinkIcon className="h-7 w-7 text-ink rounded-full bg-[color-mix(in_srgb,var(--color-theme-border-default)_70%,transparent)] p-1" />
                }
                title={<Translate>No References</Translate>}
                description={
                  <Translate>
                    To add references you can start by selecting text in the document
                  </Translate>
                }
              />
            )}
          </div>
        </Panel.Body>

        <Panel.Footer>
          <div className="flex items-center justify-between w-full" />
        </Panel.Footer>
      </Panel>

      {referenceToDelete && (
        <ConfirmationModal
          header={<Translate>Delete reference</Translate>}
          body={
            <Translate>
              Are you sure you want to delete this reference? This action cannot be undone.
            </Translate>
          }
          acceptButton={<Translate>Delete</Translate>}
          cancelButton={<Translate>Cancel</Translate>}
          dangerStyle
          disabled={isDeleting}
          onAcceptClick={handleConfirmDelete}
          onCancelClick={handleCancelDelete}
        />
      )}
    </>
  );
};

export { ReferencesPanel };
