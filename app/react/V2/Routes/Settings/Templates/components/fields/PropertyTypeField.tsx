import React from 'react';
import { Controller } from 'react-hook-form';
import { Select } from '#V2/Components/Forms/index.js';
import { t, Translate } from '#app/I18N/index.js';
import { useAtomValue } from 'jotai';
import { settingsAtom } from '#V2/atoms/index.js';

interface PropertyTypeFieldProps {
  control: any;
  disabled?: boolean;
}

export const PropertyTypeField = ({ control, disabled }: PropertyTypeFieldProps) => {
  const settings = useAtomValue(settingsAtom);

  const propertyTypeOptions = [
    { value: 'text', label: t('System', 'Text', null, false) },
    { value: 'markdown', label: t('System', 'Rich text', null, false) },
    { value: 'numeric', label: t('System', 'Numeric', null, false) },
    { value: 'date', label: t('System', 'Date', null, false) },
    { value: 'multidate', label: t('System', 'Multiple dates', null, false) },
    { value: 'daterange', label: t('System', 'Date range', null, false) },
    { value: 'multidaterange', label: t('System', 'Multiple date ranges', null, false) },
    { value: 'select', label: t('System', 'Select', null, false) },
    { value: 'multiselect', label: t('System', 'Multiple select', null, false) },
    { value: 'relationship', label: t('System', 'Relationship', null, false) },
    { value: 'link', label: t('System', 'Link', null, false) },
    { value: 'image', label: t('System', 'Image', null, false) },
    { value: 'preview', label: t('System', 'Preview', null, false) },
    { value: 'media', label: t('System', 'Media', null, false) },
    { value: 'geolocation', label: t('System', 'Geolocation', null, false) },
    { value: 'generatedid', label: t('System', 'Generated ID', null, false) },
  ];

  //i shall not fear walking through the valley of death
  if (settings.project === 'cejil') {
    propertyTypeOptions.push({
      value: 'nested',
      label: t('System', 'Violated articles', null, false),
    });
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
