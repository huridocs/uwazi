import React from 'react';
import { InputField } from 'V2/Components/Forms';
import { Translate } from 'app/I18N';
import { ClientTemplateSchema } from 'V2/shared/types';
import { PropertyRow } from '../../types';

export const LabelField = ({
  register,
  errors,
  template,
  propertyToEdit,
}: {
  register: any;
  errors: any;
  template: ClientTemplateSchema;
  propertyToEdit: PropertyRow;
}) => (
  <InputField
    id="property-label"
    label={
      <div className="flex items-center gap-1">
        <Translate>Label</Translate>
        <span>*</span>
      </div>
    }
    placeholder="Text"
    hasErrors={!!errors.label || !!errors.duplicateLabel}
    errorMessage={
      (errors.label?.type === 'required' && <Translate>This field is required</Translate>) ||
      (errors.label?.type === 'duplicateLabel' && (
        <Translate>This label already exists in this template</Translate>
      ))
    }
    // eslint-disable-next-line react/jsx-props-no-spreading
    {...register('label', {
      validate: {
        required: (value: string) => Boolean(value) || 'This field is required',
        duplicateLabel: (value: string) => {
          const duplicateProperty = template.properties?.find(
            p =>
              p.label?.toLowerCase().trim() === value.toLowerCase().trim() &&
              (!propertyToEdit || p._id !== propertyToEdit._id)
          );
          if (duplicateProperty) {
            return 'This label already exists in this template';
          }
          return true;
        },
      },
    })}
  />
);
