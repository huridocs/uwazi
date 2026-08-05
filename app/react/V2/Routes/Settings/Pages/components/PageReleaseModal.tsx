import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { Button, Modal } from '#V2/Components/UI/index.js';

export interface PageReleaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  releaseMessage: string;
  onReleaseMessageChange: (message: string) => void;
  onPublish: () => void;
}

const PageReleaseModal = ({
  isOpen,
  onClose,
  releaseMessage,
  onReleaseMessageChange,
  onPublish,
}: PageReleaseModalProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <Modal size="md">
      <Modal.Header>
        <h1 className="text-xl font-medium [color:var(--color-theme-text-primary)]">
          <Translate>Publish release</Translate>
        </h1>
        <Modal.CloseButton onClick={onClose} />
      </Modal.Header>
      <Modal.Body>
        <label className="flex flex-col gap-2 text-sm" htmlFor="release-message">
          <Translate>Release message</Translate>
          <textarea
            id="release-message"
            className="min-h-24 w-full rounded-lg border p-2 text-sm [border-color:var(--color-theme-control-border)] [background-color:var(--color-theme-control-bg)]"
            value={releaseMessage}
            onChange={e => onReleaseMessageChange(e.target.value)}
          />
        </label>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="ghost" type="button" onClick={onClose}>
          <Translate>Cancel</Translate>
        </Button>
        <Button
          variant="success"
          type="button"
          disabled={!releaseMessage.trim()}
          onClick={onPublish}
        >
          <Translate>Publish</Translate>
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export { PageReleaseModal };
