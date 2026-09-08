import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { ConfirmationModal } from './ConfirmationModal.js';

type DirtyDiscardModalProps = {
  onDiscard: () => void;
  onCancel: () => void;
};

const DirtyDiscardModal = ({ onDiscard, onCancel }: DirtyDiscardModalProps) => (
  <ConfirmationModal
    header={<Translate>Unsaved changes</Translate>}
    body={
      <Translate>You have unsaved changes. Discard them? This action cannot be undone.</Translate>
    }
    acceptButton={<Translate>Discard</Translate>}
    cancelButton={<Translate>Cancel</Translate>}
    dangerStyle
    onAcceptClick={onDiscard}
    onCancelClick={onCancel}
  />
);

export type { DirtyDiscardModalProps };
export { DirtyDiscardModal };
