import React from 'react';
import { UseFormRegister, UseFormSetValue, UseFormGetFieldState } from 'react-hook-form';
import { InputField } from '../UI';

type fromPropsType = {
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  getFieldState: UseFormGetFieldState<any>;
  submitting: boolean;
};

const FormInput = (data: any, formProps: fromPropsType) => {
  const { register, setValue, getFieldState, submitting } = formProps;
  const reset = () => setValue(data.cell.value, '', { shouldDirty: true });
  const { invalid: hasErrors } = getFieldState(data.cell.value);
  return (
    <div>
      <InputField
        fieldID={data.cell.value}
        label={data.cell.row.values.language}
        hideLabel
        disabled={submitting}
        clearFieldAction={reset}
        inputControls={{ ...register(data.cell.value, { required: true }) }}
        hasErrors={hasErrors}
      />
    </div>
  );
};

export { FormInput };
