import React from 'react';
import {
  DatePropertyIcon,
  MarkdownPropertyIcon,
  NumericPropertyIcon,
  SelectPropertyIcon,
  TextPropertyIcon,
  RelationshipPropertyIcon,
  IDPropertyIcon,
  GeolocationPropertyIcon,
  ImagePropertyIcon,
  LinkPropertyIcon,
  MediaPropertyIcon,
  PreviewPropertyIcon,
  CustomPropertyIcon,
} from 'V2/Components/CustomIcons';

const propertyIcons = {
  text: <TextPropertyIcon className="w-5 h-5" />,
  date: <DatePropertyIcon className="w-5 h-5" />,
  numeric: <NumericPropertyIcon className="w-5 h-5" />,
  markdown: <MarkdownPropertyIcon className="w-5 h-5" />,
  select: <SelectPropertyIcon className="w-5 h-5" />,
  multiselect: <SelectPropertyIcon className="w-5 h-5" />,
  relationship: <RelationshipPropertyIcon className="w-5 h-5" />,
  generatedid: <IDPropertyIcon className="w-5 h-5" />,
  geolocation: <GeolocationPropertyIcon className="w-5 h-5" />,
  image: <ImagePropertyIcon className="w-5 h-5" />,
  link: <LinkPropertyIcon className="w-5 h-5" />,
  media: <MediaPropertyIcon className="w-5 h-5" />,
  multidate: <DatePropertyIcon className="w-5 h-5" />,
  multidaterange: <DatePropertyIcon className="w-5 h-5" />,
  preview: <PreviewPropertyIcon className="w-5 h-5" />,
  daterange: <DatePropertyIcon className="w-5 h-5" />,
  nested: <CustomPropertyIcon className="w-5 h-5" />,
};

const propertyIconsSmall = {
  text: <TextPropertyIcon className="w-4 h-4" />,
  date: <DatePropertyIcon className="w-4 h-4" />,
  numeric: <NumericPropertyIcon className="w-4 h-4" />,
  markdown: <MarkdownPropertyIcon className="w-4 h-4" />,
  select: <SelectPropertyIcon className="w-4 h-4" />,
  multiselect: <SelectPropertyIcon className="w-4 h-4" />,
  relationship: <RelationshipPropertyIcon className="w-4 h-4" />,
  generatedid: <IDPropertyIcon className="w-4 h-4" />,
  geolocation: <GeolocationPropertyIcon className="w-4 h-4" />,
  image: <ImagePropertyIcon className="w-4 h-4" />,
  link: <LinkPropertyIcon className="w-4 h-4" />,
  media: <MediaPropertyIcon className="w-4 h-4" />,
  multidate: <DatePropertyIcon className="w-4 h-4" />,
  multidaterange: <DatePropertyIcon className="w-4 h-4" />,
  preview: <PreviewPropertyIcon className="w-4 h-4" />,
  daterange: <DatePropertyIcon className="w-4 h-4" />,
  nested: <CustomPropertyIcon className="w-4 h-4" />,
};

export { propertyIcons, propertyIconsSmall };
