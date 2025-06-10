import React from 'react';
import { InputField } from 'V2/Components/Forms';
import { Translate } from 'app/I18N';

export const LabelField = ({ register, errors }: { register: any; errors: any }) => (
  <InputField
    id="property-label"
    label={<Translate>Label</Translate>}
    placeholder="Text"
    hasErrors={!!errors.label}
    errorMessage={errors.label && <Translate>This field is required</Translate>}
    {...register('label', { required: true })}
  />
);
