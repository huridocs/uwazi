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
              <Translate>Add thesaurus</Translate>
            </h1>
            <Translate>
              After creation you can go into Settings -&gt; Thesauri to add items
            </Translate>
          </Modal.Header>

          <Modal.Body>
            <Translate>Thesaurus</Translate>
          </Modal.Body>

          <Modal.Footer>
            <button type="button" className="" onClick={onCancel}>
              <Translate>Cancel</Translate>
            </button>
            <button type="button" className="" onClick={onSave}>
              <Translate>Save</Translate>
            </button>
          </Modal.Footer>
        </Modal>
      );

    case 'relationship':
      return (
        <Modal isOpen={isOpen} type="content" className="">
          <Modal.Header>
            <h1>
              <Translate>Add relation type</Translate>
            </h1>
          </Modal.Header>

          <Modal.Body>
            <Translate>Relation type</Translate>
          </Modal.Body>

          <Modal.Footer>
            <button type="button" className="" onClick={onCancel}>
              <Translate>Cancel</Translate>
            </button>
            <button type="button" className="" onClick={onSave}>
              <Translate>Save</Translate>
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
