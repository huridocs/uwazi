import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { ConfirmationModal } from './ConfirmationModal.js';

type PendingTranslationModalProps = {
  onAccept: () => void;
  onCancel: () => void;
};

const PendingTranslationModal = ({ onAccept, onCancel }: PendingTranslationModalProps) => (
  <ConfirmationModal
    header={<Translate>Translations are still pending</Translate>}
    body={
      <Translate>
        Some translations are still pending, saving would stop the translation process.
      </Translate>
    }
    acceptButton={<Translate>Continue</Translate>}
    cancelButton={<Translate>Cancel</Translate>}
    dangerStyle
    onAcceptClick={onAccept}
    onCancelClick={onCancel}
  />
);

export type { PendingTranslationModalProps };
export { PendingTranslationModal };
