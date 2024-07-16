import React from 'react';
import {
  DatePropertyIcon,
  MarkdownPropertyIcon,
  NumericPropertyIcon,
  SelectPropertyIcon,
  TextPropertyIcon,
  RelationshipPropertyIcon,
} from 'V2/Components/CustomIcons';

const propertyIcons = {
  text: <TextPropertyIcon className="w-5 h-5" />,
  date: <DatePropertyIcon className="w-5 h-5" />,
  numeric: <NumericPropertyIcon className="w-5 h-5" />,
  markdown: <MarkdownPropertyIcon className="w-5 h-5" />,
  select: <SelectPropertyIcon className="w-5 h-5" />,
  multiselect: <SelectPropertyIcon className="w-5 h-5" />,
  relationship: <RelationshipPropertyIcon className="w-5 h-5" />,
};

export { propertyIcons };
