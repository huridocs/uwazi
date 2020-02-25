/** @format */

import db from 'api/utils/testing_db';
import { propertyTypes } from 'shared/propertyTypes';
import { TemplateSchema } from 'shared/types/templateType';

export const template1 = db.id();
export const dictionaryId = '589af97080fc0b23471d67f4';

export default {
  templates: <TemplateSchema[]>[
    {
      _id: template1,
      name: 'template1',
      commonProperties: [{ name: 'title', label: 'Title', type: propertyTypes.text }],
      default: true,
      properties: [
        { name: 'date', label: 'Date', type: propertyTypes.date },
        { name: 'text', label: 'Recommendation', type: propertyTypes.markdown },
      ],
    },
  ],
  dictionaries: [
    { _id: db.id(), name: 'dictionary' },
    {
      _id: db.id(dictionaryId),
      name: 'dictionary 2',
      values: [
        { id: '1', label: 'value 1' },
        { id: '2', label: 'value 2' },
      ],
    },
    {
      _id: db.id(),
      name: 'Top movies',
      values: [
        {
          id: '1',
          label: 'scy fi',
          values: [
            { id: '1.1', label: 'groundhog day' },
            { id: '1.2', label: 'terminator 2' },
          ],
        },
        {
          id: '2',
          label: 'superheros',
          values: [
            { id: '2.1', label: 'batman' },
            { id: '2.2', label: 'spiderman' },
          ],
        },
        { id: '3', label: 'single value' },
      ],
    },
  ],
  settings: [
    {
      _id: db.id(),
      site_name: 'Uwazi',
      languages: [{ key: 'en', label: 'English', default: true }],
    },
  ],
};
