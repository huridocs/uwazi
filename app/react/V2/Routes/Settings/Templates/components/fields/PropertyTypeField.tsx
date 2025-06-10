import React from 'react';
import { Controller } from 'react-hook-form';
import { Select } from 'V2/Components/Forms';
import { t, Translate } from 'app/I18N';

const translationsKeys = {
  text: 'property text',
  numeric: 'property numeric',
  relationship: 'property relationship',
  select: 'property select',
  multiselect: 'property multiselect',
  image: 'property image',
  media: 'property media',
  link: 'property link',
  markdown: 'property markdown',
  date: 'property date',
  daterange: 'property daterange',
  multidate: 'property multidate',
  multidaterange: 'property multidaterange',
  preview: 'property preview',
  generatedid: 'property generatedid',
  geolocation: 'property geolocation',
};

const PROPERTY_TYPES = (Object.keys(translationsKeys) as (keyof typeof translationsKeys)[]).map(
  type => ({
    value: type,
    label: t('System', translationsKeys[type], null, false),
  })
);

export const PropertyTypeField = ({ control }: { control: any }) => (
  <Controller
    name="propertyType"
    control={control}
    render={({ field }) => (
      <Select
        id="property-type"
        label={<Translate>Property type</Translate>}
        options={PROPERTY_TYPES}
        {...field}
      />
    )}
  />
);
