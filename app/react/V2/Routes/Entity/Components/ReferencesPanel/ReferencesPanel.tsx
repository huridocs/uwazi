import React, { useState, useCallback } from 'react';
import { useRevalidator } from 'react-router';
import { TextSelection } from '@huridocs/react-text-selection-handler';
import { useAtomValue } from 'jotai';
import { LinkIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { Panel } from '#V2/Components/Layouts/Panel.js';
import { EntityReference } from '#V2/domain/entities/types.js';
import { relationshipTypesAtom } from '#V2/atoms/index.js';
import { Entity } from '#V2/domain/index.js';
import { searchByTitle } from '#V2/api/entities/index.js';
import { deleteReference, saveTextReference } from '#V2/api/relationships/index.js';
import { ConfirmationModal } from '#V2/Components/UI/index.js';
import { entityLoaderCache } from '../../EntityLoaderCache.js';
import { CreateReference } from './CreateReference.js';
import { Reference } from './Reference.js';
import { BlankState } from '../BlankState.js';
import { useReferences, useReferencesActions } from './referencesAtom.js';
import { PdfControllerApi } from '../PdfControllerContext.js';

type ReferencesPanelProps = {
  mainPdfController: PdfControllerApi;
  references?: EntityReference[];
  entity?: Entity;
};

const ReferencesPanel = ({ mainPdfController, references = [], entity }: ReferencesPanelProps) => {
  const [selectedReferenceId, setSelectedReferenceId] = useState<string | null>(null);
  const [referenceToDelete, setReferenceToDelete] = useState<EntityReference | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const relationshipTypes = useAtomValue(relationshipTypesAtom);
  const { createReferenceSelection, createReferenceMode } = useReferences();
  const { setCreateReferenceSelection } = useReferencesActions();
  const revalidator = useRevalidator();

  const lookup = useCallback(
    async (searchString: string): Promise<Entity[]> =>
      searchByTitle({
        title: searchString,
        fields: ['title', 'template', 'creationDate', 'sharedId'],
        includeFiles: true,
      }),
    []
  );

  const handleReferenceClick = useCallback(
    (reference: EntityReference) => {
      setSelectedReferenceId(reference._id);

      const selectionRectangles = reference.reference?.selectionRectangles;
      if (selectionRectangles && selectionRectangles.length > 0) {
        const rect = selectionRectangles.find(r => r.page);
        if (rect?.page) {
          const pageNumber = Number.parseInt(rect.page, 10);
          mainPdfController.goToPage(pageNumber);
        }
      }
    },
    [mainPdfController]
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
      const sourceFile = entity.mainDocument?.[0];
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
    [entity, setCreateReferenceSelection, revalidator]
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
      <Panel className="gap-4">
        <Panel.Body className="pr-1">
          <div className="flex flex-col gap-2 h-full">
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
                icon={<LinkIcon className="h-7 w-7 text-gray-900 rounded-full bg-gray-300 p-1" />}
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
