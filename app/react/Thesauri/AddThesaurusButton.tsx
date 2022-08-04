import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Translate } from 'app/I18N';
import Modal from 'app/Layout/Modal';
import { Icon } from 'UI';

const AddThesaurusButton = () => {
  const [open, setOpen] = useState(false);

  const { register, handleSubmit, errors } = useForm({
    mode: 'onSubmit',
  });

  const onSave = () => {
    setOpen(false);
  };

  return (
    <>
      <button type="button" className="btn btn-default" onClick={() => setOpen(true)}>
        <Icon icon="plus" />
        <span className="btn-label">
          <Translate translationKey="Thesaurus">Thesaurus</Translate>
        </span>
      </button>

      <Modal isOpen={open} type="content" className="new-thesaurus-modal">
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

        <form>
          <Modal.Body>
            <label htmlFor="thesaurusInput">
              <Translate translationKey="Thesaurus">Thesaurus</Translate>
            </label>
            <input
              type="text"
              name="thesaurus"
              id="thesaurusInput"
              ref={register({
                required: true,
              })}
            />
            {errors.thesaurus && errors.thesaurus.type === 'required' && (
              <p className="error">
                <Translate translationKey="This field is required">
                  This field is required
                </Translate>
              </p>
            )}
          </Modal.Body>

          <Modal.Footer>
            <button type="button" className="btn" onClick={() => setOpen(false)}>
              <Translate translationKey="Cancel">Cancel</Translate>
            </button>
            <button type="button" className="btn btn-success" onClick={handleSubmit(onSave)}>
              <Translate translationKey="Save">Save</Translate>
            </button>
          </Modal.Footer>
        </form>
      </Modal>
    </>
  );
};

export { AddThesaurusButton };
