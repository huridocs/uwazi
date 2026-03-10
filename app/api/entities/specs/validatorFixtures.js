import { PropertyTypeEnum } from 'api/core/domain/template/PropertyType';
import db from 'api/utils/testing_db';

const templateId = db.id();
const simpleTemplateId = db.id();
const nonExistentId = db.id();
const dictionary1 = db.id();
const dictionary2 = db.id();

export default {
  settings: [
    {
      languages: [
        {
          default: true,
          key: 'en',
          label: 'English',
        },
      ],
    },
  ],

  templates: [
    {
      name: 'template',
      _id: templateId,
      commonProperties: [
        {
          _id: db.id(),
          label: 'Title',
          type: PropertyTypeEnum.Text,
          name: 'title',
          isCommonProperty: true,
        },
        {
          _id: db.id(),
          label: 'Creation Date',
          type: PropertyTypeEnum.Date,
          name: 'creationDate',
          isCommonProperty: true,
        },
        {
          _id: db.id(),
          label: 'Edit Date',
          type: PropertyTypeEnum.Date,
          name: 'editDate',
          isCommonProperty: true,
        },
      ],
      properties: [
        { _id: db.id(), name: 'name', type: 'text' },
        { _id: db.id(), name: 'markdown', type: 'markdown' },
        { _id: db.id(), name: 'numeric', type: 'numeric' },
        { _id: db.id(), name: 'date', type: 'date' },
        { _id: db.id(), name: 'daterange', type: 'daterange' },
        { _id: db.id(), name: 'multidate', type: 'multidate' },
        { _id: db.id(), name: 'multidaterange', type: 'multidaterange' },
        { _id: db.id(), name: 'select', type: 'select', content: dictionary1 },
        { _id: db.id(), name: 'multiselect', type: 'multiselect', content: dictionary2 },
        { _id: db.id(), name: 'relationship', type: 'relationship', content: simpleTemplateId },
        { _id: db.id(), name: 'relationship2', type: 'relationship', content: simpleTemplateId },
        {
          _id: db.id(),
          name: 'newRelationship',
          type: 'newRelationship',
          query: [
            {
              types: [db.id()],
              direction: 'out',
              match: [
                {
                  templates: [simpleTemplateId],
                  traverse: [],
                },
              ],
            },
          ],
          targetTemplates: [simpleTemplateId],
        },
        {
          _id: db.id(),
          name: 'newRelationship2',
          type: 'newRelationship',
          query: [
            {
              types: [db.id()],
              direction: 'out',
              match: [
                {
                  templates: [],
                  traverse: [
                    {
                      types: [db.id()],
                      direction: 'out',
                      match: [
                        {
                          templates: [simpleTemplateId],
                          traverse: [],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
          targetTemplates: false,
        },
        {
          _id: db.id(),
          name: 'media',
          type: 'media',
        },
        {
          _id: db.id(),
          name: 'image',
          type: 'image',
        },
        {
          _id: db.id(),
          name: 'link',
          type: 'link',
        },
        {
          _id: db.id(),
          name: 'preview',
          type: 'preview',
        },
        {
          _id: db.id(),
          name: 'geolocation',
          type: 'geolocation',
        },
        {
          _id: db.id(),
          name: 'required_multiselect',
          type: 'multiselect',
          content: dictionary2,
        },
        {
          _id: db.id(),
          name: 'field_nested',
          type: 'nested',
        },
      ],
    },
    {
      _id: simpleTemplateId,
      commonProperties: [
        {
          _id: db.id(),
          label: 'Title',
          type: PropertyTypeEnum.Text,
          name: 'title',
          isCommonProperty: true,
        },
        {
          _id: db.id(),
          label: 'Creation Date',
          type: PropertyTypeEnum.Date,
          name: 'creationDate',
          isCommonProperty: true,
        },
        {
          _id: db.id(),
          label: 'Edit Date',
          type: PropertyTypeEnum.Date,
          name: 'editDate',
          isCommonProperty: true,
        },
      ],
      properties: [
        {
          _id: db.id(),
          name: 'markdown',
          type: 'markdown',
        },
      ],
    },
  ],
  entities: [
    { sharedId: 'entity1', language: 'en', template: simpleTemplateId },
    { sharedId: 'entity2', language: 'en' },
    { sharedId: 'entity3', language: 'en', template: simpleTemplateId },
  ],
  dictionaries: [
    {
      _id: dictionary1,
      name: 'Dictionary 1',
      values: [
        { _id: db.id(), id: 'dic1-value1' },
        { _id: db.id(), id: 'dic1-value2' },
      ],
    },
    {
      _id: dictionary2,
      name: 'Dictionary 2',
      values: [
        {
          id: '1',
          label: 'subgroup',
          values: [
            { _id: db.id(), id: 'dic2-value1' },
            { _id: db.id(), id: 'dic2-value2' },
          ],
        },
      ],
    },
  ],
};

export { templateId, simpleTemplateId, nonExistentId };
