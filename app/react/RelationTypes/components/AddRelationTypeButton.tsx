import React, { useState } from 'react';
import { bindActionCreators, Dispatch } from 'redux';
import { connect, ConnectedProps } from 'react-redux';
import { useForm } from 'react-hook-form';
import { Translate } from 'app/I18N';
import { IStore } from 'app/istore';
import Modal from 'app/Layout/Modal';
import { Icon } from 'UI';
import { saveRelationType } from '../actions/relationTypeActions';

const mapDispatchToProps = (dispatch: Dispatch<{}>) =>
  bindActionCreators(
    {
      relationTypeSave: saveRelationType,
    },
    dispatch
  );

const mapStateToProps = (state: IStore) => ({
  relationTypes: state.relationTypes,
});

const connector = connect(mapStateToProps, mapDispatchToProps);

type mappedProps = ConnectedProps<typeof connector>;

const AddRelationTypeButton = ({ relationTypeSave, relationTypes }: mappedProps) => {
  const [open, setOpen] = useState(false);

  const { register, handleSubmit, errors } = useForm({
    mode: 'onSubmit',
  });

  const onSave = (data: { relationtype: string }) => {
    const relation = {
      name: data.relationtype,
      properties: [],
    };
    relationTypeSave(relation);
    setOpen(false);
  };

  const isNotDuplicated = (value: string) =>
    !relationTypes?.find(relationType => relationType?.get('name') === value);

  return (
    <>
      <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
        <Icon icon="exchange-alt" />
        <span className="btn-label">
          <Translate translationKey="Add relation type">Add relation type</Translate>
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
                validate: {
                  duplicated: value => isNotDuplicated(value),
                },
              })}
            />

            {errors.relationtype?.type === 'required' && (
              <p className="error">
                <Translate translationKey="This field is required">
                  This field is required
                </Translate>
              </p>
            )}

            {errors.relationtype?.type === 'duplicated' && (
              <p className="error">
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

const container = connector(AddRelationTypeButton);
export { container as AddRelationTypeButton };
