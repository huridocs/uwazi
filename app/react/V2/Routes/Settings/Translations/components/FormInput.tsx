import React from 'react';
import { UseFormGetFieldState, UseFormRegister, UseFormSetValue } from 'react-hook-form';
import { Translate } from 'app/I18N';
import { InputField } from '../../../../Components/Forms';

type fromPropsType = {
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  getFieldState: UseFormGetFieldState<any>;
  submitting: boolean;
};

const FormInput = (data: any, formProps: fromPropsType) => {
  const { register, setValue, submitting, getFieldState } = formProps;
  const { error } = getFieldState(data.cell.getValue());
  const hasErrors = Boolean(error);
  const reset = () => setValue(data.cell.getValue(), '', { shouldDirty: true });
  const { onChange, onBlur, name, ref } = register(data.cell.getValue(), { required: true });

  return (
    <div>
      <InputField
        id={data.cell.getValue()}
        label={data.cell.row.original.language}
        hideLabel
        disabled={submitting}
        clearFieldAction={reset}
        errorMessage={hasErrors ? <Translate>This field is required</Translate> : ''}
        onChange={onChange}
        onBlur={onBlur}
        name={name}
        ref={ref}
      />
    </div>
  );
};

export { FormInput };
