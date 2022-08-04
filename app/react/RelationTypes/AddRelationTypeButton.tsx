import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Translate } from 'app/I18N';
import Modal from 'app/Layout/Modal';
import { Icon } from 'UI';

const AddRelationTypeButton = () => {
  const [open, setOpen] = useState(false);

  const { register, handleSubmit, errors } = useForm({
    mode: 'onSubmit',
  });

  const onSave = () => {
    setOpen(false);
  };

  return (
    <>
      <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
        <Icon icon="exchange-alt" />
        <span className="btn-label">
          <Translate translationKey="Relation type">Relation</Translate>
        </span>
      </button>

      <Modal isOpen={open} type="content" className="new-relationType-modal">
        <Modal.Header>
          <h3>
            <Translate translationKey="Add relation type">Add relation type</Translate>
          </h3>
        </Modal.Header>

        <form>
          <Modal.Body>
            <label htmlFor="relationtypeInput">
              <Translate translationKey="Relation">Relation</Translate>
            </label>
            <input
              type="text"
              name="relationtype"
              id="relationtypeInput"
              ref={register({
                required: true,
              })}
            />
            {errors.relationtype && errors.relationtype.type === 'required' && (
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

export { AddRelationTypeButton };
