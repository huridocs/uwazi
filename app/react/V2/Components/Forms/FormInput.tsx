import React from 'react';
import { UseFormGetFieldState, UseFormRegister, UseFormSetValue } from 'react-hook-form';
import { Translate } from 'app/I18N';
import { InputField } from '../Forms';

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
        hasErrors={hasErrors}
        onChange={onChange}
        onBlur={onBlur}
        name={name}
        ref={ref}
      />
      {hasErrors && (
        <div className="mt-2 font-bold text-error-700">
          <Translate>This field is required</Translate>
        </div>
      )}
    </div>
  );
};

export { FormInput };
