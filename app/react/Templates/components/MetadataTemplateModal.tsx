import React from 'react';
import Modal from 'app/Layout/Modal';
import { Translate } from 'app/I18N';

type MetadataTemplateModalTypes = 'thesaurus' | 'relationship';

interface MetadataTemplateModalProps {
  isOpen: boolean;
  type: MetadataTemplateModalTypes;
  saveAction: () => void;
  cancelAction: () => void;
}

const modalFooter = (cancelFunction: () => void, saveFunction: () => void) => (
  <Modal.Footer>
    <button type="button" className="" onClick={cancelFunction}>
      <Translate translationKey="Cancel">Cancel</Translate>
    </button>
    <button type="button" className="" onClick={saveFunction}>
      <Translate translationKey="Save">Save</Translate>
    </button>
  </Modal.Footer>
);

const MetadataTemplateModal = ({
  isOpen,
  type,
  saveAction,
  cancelAction,
}: MetadataTemplateModalProps) => {
  const onCancel = () => cancelAction();
  const onSave = () => saveAction();

  switch (type) {
    case 'thesaurus':
      return (
        <Modal isOpen={isOpen} type="content" className="metadata-template-modal">
          <Modal.Header>
            <h3>
              <Translate translationKey="Add thesaurus">Add thesaurus</Translate>
            </h3>
            <Translate translationKey="Add thesaurus description">
              After creation you can go into Settings -&gt; Thesauri to add items
            </Translate>
          </Modal.Header>

          <Modal.Body>
            <Translate translationKey="Thesaurus">Thesaurus</Translate>
            <input type="text" />
          </Modal.Body>

          {modalFooter(onCancel, onSave)}
        </Modal>
      );

    case 'relationship':
      return (
        <Modal isOpen={isOpen} type="content" className="metadata-template-modal">
          <Modal.Header>
            <h3>
              <Translate translationKey="Add connection">Add relation type</Translate>
            </h3>
          </Modal.Header>

          <Modal.Body>
            <Translate translationKey="Add connection">Relation type</Translate>
            <input type="text" />
          </Modal.Body>

          {modalFooter(onCancel, onSave)}
        </Modal>
      );

    default:
      return <></>;
  }
};

export type { MetadataTemplateModalTypes, MetadataTemplateModalProps };
export { MetadataTemplateModal };
