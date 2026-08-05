import React from 'react';
import { Translate, t } from '#app/I18N/index.js';
import { Modal } from '#V2/Components/UI/index.js';
import type { CreateRelationshipStep } from './createRelationshipModalTypes.js';

type CreateRelationshipModalHeaderProps = {
  step: CreateRelationshipStep;
  selectionPreview: string | undefined;
  isSaving: boolean;
  onClose: () => void;
};

const headerTitles: Record<CreateRelationshipStep, string> = {
  entity: t('System', 'Select target entity', null, false),
  'new-entity': t('System', 'New entity', null, false),
  'target-file': t('System', 'Select target document', null, false),
  relation: t('System', 'Choose relation type', null, false),
  'target-text': t('System', 'Select text in target document', null, false),
};

const CreateRelationshipModalHeader = ({
  step,
  selectionPreview,
  isSaving,
  onClose,
}: CreateRelationshipModalHeaderProps) => (
  <Modal.Header>
    <div className="min-w-0">
      <h3 className="text-base font-semibold text-ink">{headerTitles[step]}</h3>
      {selectionPreview ? (
        <p className="mt-0.5 max-w-[350px] truncate text-xs text-ink-secondary">
          <Translate>From:</Translate> &quot;{selectionPreview.slice(0, 60)}
          {selectionPreview.length > 60 ? '...' : ''}&quot;
        </p>
      ) : null}
    </div>
    <Modal.CloseButton onClick={onClose} disabled={isSaving} />
  </Modal.Header>
);

export { CreateRelationshipModalHeader };
