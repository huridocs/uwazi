import React from 'react';
import { Translate } from 'app/I18N';
import { useForm } from 'react-hook-form';
import Modal from '../../Layout/Modal';

interface AddThesauriValueModalProps {
  isOpen: boolean;
  values: Array<any>;
  onAccept: Function;
  onCancel: Function;
}

type FormInputs = {
  group: string;
  value: string;
};

const AddThesauriValueModal = ({
  isOpen,
  values,
  onAccept,
  onCancel,
}: AddThesauriValueModalProps) => {
  const {
    register,
    handleSubmit,
    // formState: { errors },
  } = useForm<FormInputs>({ defaultValues: { group: 'root' } });

  const onSubmitted = (submittedValues: any) => {
    onAccept(submittedValues);
  };

  const createSelectValues = () => {
    const selectOptions = [{ value: 'root', label: '<root>' }];
    if (!values) return selectOptions;
    values
      .filter((value: any) => value.values)
      .forEach((value: any) => selectOptions.push({ value: value.id, label: value.label }));
    return selectOptions;
  };

  const renderGroupSelect = (selectValues: { value: string; label: string }[]) => (
    <>
      <label className="form-label" htmlFor="group">
        <Translate>Group</Translate>
      </label>
      <select
        {...register('group')}
        className="form-control"
        style={{ marginBottom: '10px' }}
        defaultValue="root"
        id="group"
      >
        {selectValues.map(option => (
          <option value={option.value}>{option.label}</option>
        ))}
      </select>
    </>
  );

  // validateDuplicates(newValue: { group: string; value: string }): boolean {
  //   const { values } = this.props;
  //   let innerValues = values;
  //   if (newValue.group !== 'root') {
  //     innerValues = values.find(value => value.id === newValue.group)?.values || [];
  //   }
  //   const index = innerValues.findIndex(value => value.label === newValue.value);
  //   return index === -1;
  // }

  const selectValues = createSelectValues();

  return (
    <Modal isOpen={isOpen} type="info">
      <form onSubmit={handleSubmit(onSubmitted)} className="file-form">
        <Modal.Header>
          <Translate>Add thesaurus value</Translate>
        </Modal.Header>
        <Modal.Body>
          {/* {errors.name && <div>{errors.name}</div>} */}
          {selectValues.length > 1 && renderGroupSelect(selectValues)}
          <label htmlFor="newThesauriValue">
            <Translate>Value</Translate>
          </label>
          <input
            {...register('value', {
              required: true,
            })}
            className="form-control"
            placeholder="value"
            id="newThesauriValue"
          />
        </Modal.Body>

        <Modal.Footer>
          <button
            type="button"
            className="btn btn-default cancel-button"
            onClick={() => onCancel()}
          >
            <Translate>Cancel</Translate>
          </button>
          <button type="submit" className="btn confirm-button">
            <Translate>Save</Translate>
          </button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};

export default AddThesauriValueModal;
export type { AddThesauriValueModalProps };
