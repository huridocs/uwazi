import React from 'react';
import { Translate } from '#app/I18N/index.js';
import type { ClientRelationshipType } from '#app/apiResponseTypes.js';
import type { FileType } from '#shared/types/fileType.js';
import type { Entity } from '#V2/api/entities/types.js';
import { Button, Modal } from '#V2/Components/UI/index.js';
import { TemplateLabel } from '#V2/Components/Metadata/Components/index.js';

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
        {relationshipTypes.map(relationshipType => (
          <button
            key={relationshipType._id}
            type="button"
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
