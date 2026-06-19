import React from 'react';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import type { FileType } from '#shared/types/fileType.js';
import type { Entity } from '#V2/api/entities/types.js';
import { Button, Modal } from '#V2/Components/UI/index.js';
import { TemplateLabel } from '#V2/Components/Metadata/Components/index.js';

type TargetFileStepProps = {
  selectedEntity: Entity;
  targetPdfFiles: FileType[];
  isSaving: boolean;
  onBack: () => void;
  onFileSelect: (file: FileType) => void;
  onSkip: () => void;
};

const TargetFileStep = ({
  selectedEntity,
  targetPdfFiles,
  isSaving,
  onBack,
  onFileSelect,
  onSkip,
}: TargetFileStepProps) => (
  <>
    <div className="border-b border-border/50 px-5 py-4">
      <div className="flex items-center gap-2">
        <TemplateLabel templateId={selectedEntity.template} />
        <span className="text-sm text-ink">{selectedEntity.title}</span>
      </div>
    </div>
    <Modal.Body className="space-y-2">
      <p className="text-sm text-ink-secondary">
        <Translate>Select a document to connect to a specific paragraph</Translate>
      </p>
      {targetPdfFiles.map((file, index) => {
        const fileId = String(file._id) || file.filename || `file-${index}`;
        return (
          <button
            key={fileId}
            type="button"
            onClick={() => onFileSelect(file)}
            className="flex w-full items-center justify-between rounded-md border border-border bg-warm px-3 py-2 text-left transition-colors hover:border-ink/30"
          >
            <span className="text-sm text-ink">{file.originalname || file.filename}</span>
            <DocumentTextIcon className="h-5 w-5 text-ink-muted" aria-hidden="true" />
          </button>
        );
      })}
    </Modal.Body>
    <Modal.Footer className="flex justify-between">
      <Button variant="secondary" onClick={onBack} disabled={isSaving}>
        <Translate>Back</Translate>
      </Button>
      <Button variant="secondary" onClick={onSkip} disabled={isSaving}>
        <Translate>Connect to entity</Translate>
      </Button>
    </Modal.Footer>
  </>
);

export { TargetFileStep };
