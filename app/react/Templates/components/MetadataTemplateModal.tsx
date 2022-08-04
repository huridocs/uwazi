import React from 'react';
import Modal from 'app/Layout/Modal';
import { Translate } from 'app/I18N';
import { ThesaurusSchema } from 'shared/types/thesaurusType';
import { useForm } from 'react-hook-form';

type MetadataTemplateModalTypes = 'thesaurus' | 'relationship';
type saveActionData = { thesaurus?: ThesaurusSchema; relationship?: { name: string } };

interface MetadataTemplateModalProps {
  isOpen: boolean;
  type: MetadataTemplateModalTypes;
  saveFunction: (data: saveActionData) => void;
  cancelFunction: () => void;
}

const MetadataTemplateModal = ({
  isOpen,
  type,
  saveFunction,
  cancelFunction,
}: MetadataTemplateModalProps) => {
  const { register, handleSubmit, errors } = useForm({
    mode: 'onSubmit',
  });

  const onCancel = () => cancelFunction();

  const onSave = (data: saveActionData) => {
    saveFunction(data);
  };

  const modalForm = (label: string | object | null | undefined) => (
    <form>
      <Modal.Body>
        <label htmlFor={`${type}Input`}>{label}</label>
        <input
          type="text"
          name={type}
          id={`${type}Input`}
          ref={register({
            required: true,
          })}
        />
        {errors[type] && errors[type].type === 'required' && (
          <p className="error">
            <Translate translationKey="This field is required">This field is required</Translate>
          </p>
        )}
      </Modal.Body>

      <Modal.Footer>
        <button type="button" className="btn" onClick={onCancel}>
          <Translate translationKey="Cancel">Cancel</Translate>
        </button>
        <button type="button" className="btn btn-success" onClick={handleSubmit(onSave)}>
          <Translate translationKey="Save">Save</Translate>
        </button>
      </Modal.Footer>
    </form>
  );

  switch (type) {
    case 'thesaurus':
      return (
        <Modal isOpen={isOpen} type="content" className="metadata-template-modal">
          <Modal.Header>
            <h3>
              <Translate translationKey="Add thesaurus">Add thesaurus</Translate>
            </h3>
            <p className="description">
              <Translate translationKey="Add thesaurus description">
                After creation you can go into Settings -&gt; Thesauri to add items
              </Translate>
            </p>
          </Modal.Header>

          {modalForm(<Translate translationKey="Thesaurus">Thesaurus</Translate>)}
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

          {modalForm(<Translate translationKey="Relationship">Relationship</Translate>)}
        </Modal>
      );

    default:
      return <></>;
  }
};

export type { MetadataTemplateModalTypes, MetadataTemplateModalProps, saveActionData };
export { MetadataTemplateModal };
