import React, { useState } from 'react';
import { bindActionCreators, Dispatch } from 'redux';
import { connect, ConnectedProps } from 'react-redux';
import { SubmitHandler, useForm } from 'react-hook-form';
import { Translate } from 'app/I18N';
import Modal from 'app/Layout/Modal';
import { IStore } from 'app/istore';
import { Icon } from 'UI';
import { saveThesaurus } from '../actions/thesauriActions';

const mapStateToProps = (state: IStore) => ({
  thesauri: state.thesauris,
});

const mapDispatchToProps = (dispatch: Dispatch<{}>) =>
  bindActionCreators(
    {
      thesaurusSave: saveThesaurus,
    },
    dispatch
  );

const connector = connect(mapStateToProps, mapDispatchToProps);

type mappedProps = ConnectedProps<typeof connector>;

const AddThesaurusButton = ({ thesaurusSave, thesauri }: mappedProps) => {
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ thesaurus: string }>({
    mode: 'onSubmit',
  });

  const onSave: SubmitHandler<{ thesaurus: string }> = data => {
    const thesaurus = {
      name: data.thesaurus,
      values: [],
    };
    thesaurusSave(thesaurus);
    setOpen(false);
  };

  const isNotDuplicated = (value: string) =>
    !thesauri?.find(
      thesaurus => thesaurus?.get('type') !== 'template' && thesaurus?.get('name') === value
    );

  return (
    <>
      <button type="button" className="btn btn-default" onClick={() => setOpen(true)}>
        <Icon icon="book" />
        <span className="btn-label">
          <Translate translationKey="Add thesaurus">Add thesaurus</Translate>
        </span>
      </button>

      <Modal isOpen={open} type="content" className="new-thesaurus-modal">
        <Modal.Header>
          <h3>
            <Translate translationKey="Add thesaurus">Add thesaurus</Translate>
          </h3>
          <p className="description">
            <Translate translationKey="Add thesaurus modal description">
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
              id="thesaurusInput"
              {...register('thesaurus', {
                required: true,
                validate: {
                  duplicated: value => isNotDuplicated(value),
                },
              })}
              autoComplete="off"
            />

            {errors.thesaurus?.type === 'required' && (
              <p className="error" role="alert">
                <Translate translationKey="This field is required">
                  This field is required
                </Translate>
              </p>
            )}

            {errors.thesaurus?.type === 'duplicated' && (
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

const container = connector(AddThesaurusButton);
export { container as AddThesaurusButton };
