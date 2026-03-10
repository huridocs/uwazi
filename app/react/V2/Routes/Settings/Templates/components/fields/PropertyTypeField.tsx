import React from 'react';
import { Controller } from 'react-hook-form';
import { Select } from 'V2/Components/Forms';
import { Translate } from 'app/I18N';
import { useAtomValue } from 'jotai';
import { settingsAtom } from 'V2/atoms';

interface PropertyTypeFieldProps {
  control: any;
  disabled?: boolean;
}

export const PropertyTypeField = ({ control, disabled }: PropertyTypeFieldProps) => {
  const settings = useAtomValue(settingsAtom);

  const propertyTypeOptions = [
    { value: 'text', label: 'Text' },
    { value: 'markdown', label: 'Rich text' },
    { value: 'numeric', label: 'Numeric' },
    { value: 'date', label: 'Date' },
    { value: 'multidate', label: 'Multiple dates' },
    { value: 'daterange', label: 'Date range' },
    { value: 'multidaterange', label: 'Multiple date ranges' },
    { value: 'select', label: 'Select' },
    { value: 'multiselect', label: 'Multiple select' },
    { value: 'relationship', label: 'Relationship' },
    { value: 'link', label: 'Link' },
    { value: 'image', label: 'Image' },
    { value: 'preview', label: 'Preview' },
    { value: 'media', label: 'Media' },
    { value: 'geolocation', label: 'Geolocation' },
    { value: 'generatedid', label: 'Generated ID' },
  ];

  //i shall not fear walking through the valley of death
  if (settings.project === 'cejil') {
    propertyTypeOptions.push({ value: 'nested', label: 'Violated articles' });
  }

  return (
    <Controller
      name="type"
      control={control}
      rules={{ required: true }}
      render={({ field }) => (
        <Select
          id="property-type"
          label={
            <div className="flex items-center gap-1">
              <Translate>Property type</Translate>
              <span>*</span>
            </div>
          }
          options={propertyTypeOptions}
          disabled={disabled}
          {...field}
        />
      )}
    />
  );
};
