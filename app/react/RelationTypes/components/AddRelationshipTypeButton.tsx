import React, { useState } from 'react';
import { bindActionCreators, Dispatch } from 'redux';
import { connect, ConnectedProps } from 'react-redux';
import { SubmitHandler, useForm } from 'react-hook-form';
import { Translate } from 'app/I18N';
import { IStore } from 'app/istore';
import Modal from 'app/Layout/Modal';
import { Icon } from 'UI';
import { saveRelationType } from '../actions/relationTypeActions';

type FormInputs = {
  relationshipType: string;
};

const mapDispatchToProps = (dispatch: Dispatch<{}>) =>
  bindActionCreators(
    {
      relationshipTypeSave: saveRelationType,
    },
    dispatch
  );

const mapStateToProps = (state: IStore) => ({
  relationshipTypes: state.relationTypes,
});

const connector = connect(mapStateToProps, mapDispatchToProps);

type mappedProps = ConnectedProps<typeof connector>;

const AddRelationshipTypeButton = ({ relationshipTypeSave, relationshipTypes }: mappedProps) => {
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInputs>({
    mode: 'onSubmit',
  });

  const onSave: SubmitHandler<FormInputs> = data => {
    const relationship = {
      name: data.relationshipType,
      properties: [],
    };
    relationshipTypeSave(relationship);
    setOpen(false);
  };

  const isNotDuplicated = (value: string) =>
    !relationshipTypes?.find(type => type?.get('name') === value);

  return (
    <>
      <button type="button" className="btn btn-default" onClick={() => setOpen(true)}>
        <Icon icon="exchange-alt" />
        <span className="btn-label">
          <Translate translationKey="Add relationship type">Add relationship type</Translate>
        </span>
      </button>

      <Modal isOpen={open} type="content" className="new-relationshipType-modal">
        <Modal.Header>
          <h3>
            <Translate translationKey="Add relationship type">Add relationship type</Translate>
          </h3>
        </Modal.Header>

        <form>
          <Modal.Body>
            <label htmlFor="relationshipTypeInput">
              <Translate translationKey="Relationship">Relationship</Translate>
            </label>
            <input
              type="text"
              id="relationshipTypeInput"
              {...register('relationshipType', {
                required: true,
                validate: {
                  duplicated: value => isNotDuplicated(value),
                },
              })}
              autoComplete="off"
            />

            {errors.relationshipType?.type === 'required' && (
              <p className="error" role="alert">
                <Translate translationKey="This field is required">
                  This field is required
                </Translate>
              </p>
            )}

            {errors.relationshipType?.type === 'duplicated' && (
              <p className="error" role="alert">
                <Translate translationKey="Duplicated name">Duplicated name</Translate>
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

const container = connector(AddRelationshipTypeButton);
export { container as AddRelationshipTypeButton };
