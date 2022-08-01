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
        <Modal isOpen={isOpen} type="content" className="">
          <Modal.Header>
            <h1>
              <Translate translationKey="Add thesaurus">Add thesaurus</Translate>
            </h1>
            <Translate translationKey="Add thesaurus description">
              After creation you can go into Settings -&gt; Thesauri to add items
            </Translate>
          </Modal.Header>

          <Modal.Body>
            <Translate translationKey="Thesaurus">Thesaurus</Translate>
          </Modal.Body>

          <Modal.Footer>
            <button type="button" className="" onClick={onCancel}>
              <Translate translationKey="Cancel">Cancel</Translate>
            </button>
            <button type="button" className="" onClick={onSave}>
              <Translate translationKey="Save">Save</Translate>
            </button>
          </Modal.Footer>
        </Modal>
      );

    case 'relationship':
      return (
        <Modal isOpen={isOpen} type="content" className="">
          <Modal.Header>
            <h1>
              <Translate translationKey="Add connection">Add relation type</Translate>
            </h1>
          </Modal.Header>

          <Modal.Body>
            <Translate translationKey="Add connection">Relation type</Translate>
          </Modal.Body>

          <Modal.Footer>
            <button type="button" className="" onClick={onCancel}>
              <Translate translationKey="Cancel">Cancel</Translate>
            </button>
            <button type="button" className="" onClick={onSave}>
              <Translate translationKey="Save">Save</Translate>
            </button>
          </Modal.Footer>
        </Modal>
      );

    default:
      return <></>;
  }
};

export type { MetadataTemplateModalTypes };
export { MetadataTemplateModal };
