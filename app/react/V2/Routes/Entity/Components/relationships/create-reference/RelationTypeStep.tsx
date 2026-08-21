import React, { useCallback, useState } from 'react';
import { useAtomValue } from 'jotai';
import { t, Translate } from '#app/I18N/index.js';
import type { ClientRelationshipType } from '#app/apiResponseTypes.js';
import type { FileType } from '#shared/types/fileType.js';
import type { Entity } from '#V2/api/entities/types.js';
import { useRelationshipTypeMutations } from '#V2/services/useRelationshipTypeMutations.js';
import { userAtom } from '#V2/atoms/index.js';
import { useRequestStatus } from '#V2/atoms/requestStatusAtom.js';
import { PlusStrokeIcon } from '#V2/Components/CustomIcons/index.js';
import { TemplateLabel } from '#V2/Components/Metadata/Components/index.js';
import { Button, Modal } from '#V2/Components/UI/index.js';
import { checkRole } from '#V2/Components/UI/NeedAuthorization.js';

type RelationTypeStepProps = {
  selectedEntity: Entity;
  selectedFile: FileType | undefined;
  relationshipTypes: ClientRelationshipType[];
  selectedRelationshipType: string | undefined;
  isSaving: boolean;
  onBack: () => void;
  onRelationshipTypeSelect: (relationshipTypeId: string) => void;
  onContinueToTargetText: () => void;
  onCreate: () => void;
};

const typeInputClassName =
  'flex-1 rounded-md border border-border bg-warm px-3 py-2 text-sm placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-carbon/20';

const RelationTypeStep = ({
  selectedEntity,
  selectedFile,
  relationshipTypes,
  selectedRelationshipType,
  isSaving,
  onBack,
  onRelationshipTypeSelect,
  onContinueToTargetText,
  onCreate,
}: RelationTypeStepProps) => {
  const needsTargetText = Boolean(selectedFile);
  const user = useAtomValue(userAtom);
  const isAdmin = checkRole(user, ['admin']);
  const { create } = useRelationshipTypeMutations();
  const { notify } = useRequestStatus();
  const [draftName, setDraftName] = useState('');
  const [duplicateError, setDuplicateError] = useState(false);
  const [isCreatingType, setIsCreatingType] = useState(false);
  const isEmpty = relationshipTypes.length === 0;

  const handleAdd = useCallback(async () => {
    if (!draftName.trim() || isCreatingType) return;
    setIsCreatingType(true);
    try {
      const result = await create(draftName);
      if (result.status === 'duplicate') {
        setDuplicateError(true);
        return;
      }
      if (result.status === 'error') {
        notify('error', result.message);
        return;
      }
      notify(
        'success',
        t('System', 'Added relation type "{name}"', null, false).replace('{name}', result.type.name)
      );
      onRelationshipTypeSelect(result.type._id);
      setDraftName('');
      setDuplicateError(false);
    } finally {
      setIsCreatingType(false);
    }
  }, [create, draftName, isCreatingType, notify, onRelationshipTypeSelect]);

  const addRelationshipType = useCallback(
    async () =>
      handleAdd().catch(error => {
        notify('error', error.message);
      }),
    [handleAdd, notify]
  );

  return (
    <>
      <div className="border-b border-border/50 px-5 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-ink-muted">
            <Translate>Target:</Translate>
          </span>
          <TemplateLabel templateId={selectedEntity.template} />
          <span className="text-sm text-ink">{selectedEntity.title}</span>
          {selectedFile ? (
            <span className="text-xs text-ink-secondary">
              · {selectedFile.originalname || selectedFile.filename}
            </span>
          ) : null}
        </div>
      </div>
      <Modal.Body className="space-y-1">
        {isEmpty ? (
          <div className="py-8 text-center">
            <p className="text-sm font-medium text-ink-secondary">
              <Translate>No relationship types</Translate>
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              {isAdmin ? (
                <Translate>Create a type to continue.</Translate>
              ) : (
                <Translate>
                  An admin needs to add relationship types before you can create a relationship.
                </Translate>
              )}
            </p>
          </div>
        ) : null}
        {relationshipTypes.map(relationshipType => (
          <button
            key={relationshipType._id}
            type="button"
            aria-pressed={selectedRelationshipType === relationshipType._id}
            onClick={() => onRelationshipTypeSelect(relationshipType._id)}
            className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors ${
              selectedRelationshipType === relationshipType._id
                ? 'bg-carbon-tint ring-1 ring-carbon/30'
                : 'hover:bg-warm'
            }`}
          >
            <span className="text-sm text-ink">{relationshipType.name}</span>
          </button>
        ))}
        {isAdmin ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={draftName}
                onChange={event => {
                  setDraftName(event.target.value);
                  setDuplicateError(false);
                }}
                onKeyDown={async event => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    await addRelationshipType();
                  }
                }}
                placeholder={t('System', 'New relation type label…', null, false)}
                className={typeInputClassName}
              />
              <Button
                variant="primary"
                className="inline-flex items-center gap-1"
                onClick={addRelationshipType}
                disabled={!draftName.trim() || isCreatingType || isSaving}
              >
                <PlusStrokeIcon className="h-3 w-3" aria-hidden="true" />
                <Translate>Add</Translate>
              </Button>
            </div>
            {duplicateError ? (
              <p className="text-xs text-seal">
                <Translate>Already exists</Translate>
              </p>
            ) : null}
          </div>
        ) : null}
      </Modal.Body>
      <Modal.Footer className="flex justify-between">
        <Button variant="secondary" onClick={onBack} disabled={isSaving}>
          <Translate>Back</Translate>
        </Button>
        {needsTargetText ? (
          <Button
            variant="primary"
            onClick={onContinueToTargetText}
            disabled={!selectedRelationshipType || isSaving}
          >
            <Translate>Continue</Translate>
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={onCreate}
            disabled={!selectedRelationshipType || isSaving}
          >
            <Translate>Create relationship</Translate>
          </Button>
        )}
      </Modal.Footer>
    </>
  );
};

export { RelationTypeStep };
