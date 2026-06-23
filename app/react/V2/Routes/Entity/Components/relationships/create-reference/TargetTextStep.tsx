import React from 'react';
import type { TextSelection } from '@huridocs/react-text-selection-handler';
import { Translate } from '#app/I18N/index.js';
import type { FileType } from '#shared/types/fileType.js';
import type { Entity } from '#V2/api/entities/types.js';
import { Button, Modal } from '#V2/Components/UI/index.js';
import { SelectTextInTargetStep } from './SelectTextInTargetStep.js';

type TargetTextStepProps = {
  selectedEntity: Entity;
  selectedFile: FileType;
  selectedRelationshipType: string | undefined;
  targetSelection: TextSelection | undefined;
  isSaving: boolean;
  onBack: () => void;
  onCreate: () => void;
  onTargetPdfSelect: (selection: TextSelection) => void;
  onTargetPdfDeselect: () => void;
};

const TargetTextStep = ({
  selectedEntity,
  selectedFile,
  selectedRelationshipType,
  targetSelection,
  isSaving,
  onBack,
  onCreate,
  onTargetPdfSelect,
  onTargetPdfDeselect,
}: TargetTextStepProps) => (
  <>
    <Modal.Body className="flex min-h-[50vh] flex-col">
      <SelectTextInTargetStep
        selectedEntity={selectedEntity}
        selectedFile={selectedFile}
        onTargetPdfSelect={onTargetPdfSelect}
        onTargetPdfDeselect={onTargetPdfDeselect}
      />
    </Modal.Body>
    <Modal.Footer className="flex justify-between">
      <Button variant="secondary" onClick={onBack} disabled={isSaving}>
        <Translate>Back</Translate>
      </Button>
      <Button
        variant="primary"
        onClick={onCreate}
        disabled={!selectedRelationshipType || !targetSelection || isSaving}
      >
        <Translate>Save</Translate>
      </Button>
    </Modal.Footer>
  </>
);

export { TargetTextStep };
