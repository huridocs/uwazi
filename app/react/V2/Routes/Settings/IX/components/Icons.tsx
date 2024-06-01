import React from 'react';
import {
  DatePropertyIcon,
  MarkdownPropertyIcon,
  NumericPropertyIcon,
  SelectPropertyIcon,
  TextPropertyIcon,
} from 'V2/Components/CustomIcons';

const propertyIcons = {
  text: <TextPropertyIcon />,
  date: <DatePropertyIcon />,
  numeric: <NumericPropertyIcon />,
  markdown: <MarkdownPropertyIcon />,
  select: <SelectPropertyIcon />,
  multiselect: <SelectPropertyIcon />,
};

export { propertyIcons };
