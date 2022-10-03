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

const createSelectValues = (values: any[]) => {
  const selectOptions = [{ value: 'root', label: '<root>' }];
  if (!values) return selectOptions;
  values
    .filter((value: any) => value.values)
    .forEach((value: any) => selectOptions.push({ value: value.id, label: value.label }));
  return selectOptions;
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
    formState: { errors },
    getValues,
    reset,
  } = useForm<FormInputs>({ defaultValues: { group: 'root' } });

  const onSubmitted = (submittedValues: any) => {
    onAccept(submittedValues);
  };

  const renderGroupSelect = (selectValues: { value: string; label: string }[]) => (
    <>
      <label className="form-label" htmlFor="group">
        <Translate>Group</Translate>
      </label>
      <select
        {...register('group')}
        className="form-control thesauri-group"
        defaultValue="root"
        id="group"
      >
        {selectValues.map(option => (
          <option value={option.value} key={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </>
  );

  const validateDuplicates = (newValue: FormInputs): boolean => {
    let innerValues = values;
    if (newValue.group !== 'root') {
      innerValues = values.find(value => value.id === newValue.group)?.values || [];
    }
    const index = innerValues.findIndex(value => value.label === newValue.value);
    return index === -1;
  };

  const selectValues = createSelectValues(values);

  return (
    <Modal isOpen={isOpen} type="info" className="add-thesauriValue-modal">
      <form
        onSubmit={async e => {
          e.preventDefault();
          e.stopPropagation();
          await handleSubmit(onSubmitted)(e);
        }}
        className="file-form"
      >
        <Modal.Header>
          <Translate>Add thesaurus value</Translate>
        </Modal.Header>
        <Modal.Body>
          {errors.value && (
            <p className="error" role="alert">
              <Translate>Duplicate values not allowed.</Translate>
            </p>
          )}
          {selectValues.length > 1 && renderGroupSelect(selectValues)}
          <label htmlFor="newThesauriValue">
            <Translate>Value</Translate>
          </label>
          <input
            {...register('value', {
              required: true,
              validate: () => validateDuplicates(getValues()),
            })}
            className="form-control"
            placeholder="value"
            id="newThesauriValue"
          />
        </Modal.Body>

        <Modal.Footer>
          <button
            type="button"
            className="btn cancel-button"
            onClick={() => {
              reset({ group: 'root', value: '' });
              onCancel();
            }}
          >
            <Translate>Cancel</Translate>
          </button>
          <button type="submit" className="btn btn-success confirm-button">
            <Translate>Save</Translate>
          </button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};

export default AddThesauriValueModal;
export type { AddThesauriValueModalProps };
