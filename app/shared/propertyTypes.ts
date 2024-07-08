import { PropertySchema } from './types/commonTypes';

const propertyTypes = {
  date: 'date' as 'date',
  daterange: 'daterange' as 'daterange',
  geolocation: 'geolocation' as 'geolocation',
  image: 'image' as 'image',
  link: 'link' as 'link',
  markdown: 'markdown' as 'markdown',
  media: 'media' as 'media',
  multidate: 'multidate' as 'multidate',
  multidaterange: 'multidaterange' as 'multidaterange',
  multiselect: 'multiselect' as 'multiselect',
  nested: 'nested' as 'nested',
  numeric: 'numeric' as 'numeric',
  preview: 'preview' as 'preview',
  relationship: 'relationship' as 'relationship',
  select: 'select' as 'select',
  text: 'text' as 'text',
  generatedid: 'generatedid' as 'generatedid',
  newRelationship: 'newRelationship' as 'newRelationship',
};

function getCompatibleTypes(type: keyof typeof propertyTypes): Array<keyof typeof propertyTypes> {
  switch (type) {
    case propertyTypes.date:
    case propertyTypes.multidate:
      return [propertyTypes.date, propertyTypes.multidate];
    case propertyTypes.daterange:
    case propertyTypes.multidaterange:
      return [propertyTypes.daterange, propertyTypes.multidaterange];
    case propertyTypes.select:
    case propertyTypes.multiselect:
      return [propertyTypes.select, propertyTypes.multiselect];
    case propertyTypes.text:
    case propertyTypes.markdown:
      return [propertyTypes.text, propertyTypes.markdown];

    default:
      return [type];
  }
}

const propertyIsSelect = (propertyType: PropertySchema['type']) => propertyType === 'select';

const propertyIsMultiselect = (propertyType: PropertySchema['type']) =>
  propertyType === 'multiselect';

const propertyIsSelectOrMultiSelect = (propertyType: PropertySchema['type']) =>
  propertyIsSelect(propertyType) || propertyIsMultiselect(propertyType);

const propertyIsRelationship = (propertyType: string) => propertyType === 'relationship';

export {
  propertyTypes,
  getCompatibleTypes,
  propertyIsSelect,
  propertyIsMultiselect,
  propertyIsSelectOrMultiSelect,
  propertyIsRelationship,
};
