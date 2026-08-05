import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { ConfirmationModal } from './ConfirmationModal.js';

type DirtyDiscardAction = 'leave' | 'switch';

type DirtyDiscardModalProps = {
  action: DirtyDiscardAction;
  onDiscard: () => void;
  onCancel: () => void;
};

const DirtyDiscardModal = ({ action, onDiscard, onCancel }: DirtyDiscardModalProps) => (
  <ConfirmationModal
    header={<Translate>Unsaved changes</Translate>}
    body={
      action === 'leave' ? (
        <Translate>
          You have unsaved changes. Discard them and leave this page? This action cannot be undone.
        </Translate>
      ) : (
        <Translate>
          You have unsaved changes. Discard them and switch language? This action cannot be undone.
        </Translate>
      )
    }
    acceptButton={
      action === 'leave' ? (
        <Translate>Discard and leave</Translate>
      ) : (
        <Translate>Discard and switch</Translate>
      )
    }
    cancelButton={<Translate>Cancel</Translate>}
    dangerStyle
    onAcceptClick={onDiscard}
    onCancelClick={onCancel}
  />
);

export type { DirtyDiscardAction, DirtyDiscardModalProps };
export { DirtyDiscardModal };
