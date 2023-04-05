import React from 'react';
import { ErrorMessage } from '@hookform/error-message';
import { FieldErrors, UseFormRegister, UseFormSetValue } from 'react-hook-form';
import { Translate } from 'app/I18N';
import { InputField } from '../UI';

type fromPropsType = {
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  errors: FieldErrors<any>;
  submitting: boolean;
};

const FormInput = (data: any, formProps: fromPropsType) => {
  const { register, setValue, errors, submitting } = formProps;
  const reset = () => setValue(data.cell.value, '', { shouldDirty: true });
  return (
    <div>
      <InputField
        fieldID={data.cell.value}
        label={data.cell.row.values.language}
        hideLabel
        disabled={submitting}
        clearFieldAction={reset}
        inputControls={{
          ...register(data.cell.value, {
            required: true,
          }),
        }}
      />
      <div className="mt-2 text-error-700 font-bold">
        <ErrorMessage
          name={data.cell.value}
          errors={errors}
          render={() => <Translate>This field is required</Translate>}
        />
      </div>
    </div>
  );
};

export { FormInput };
