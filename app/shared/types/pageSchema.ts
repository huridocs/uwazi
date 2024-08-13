import Ajv from 'ajv';

import templatesModel from 'api/templates/templatesModel';

import { objectIdSchema } from 'shared/types/commonSchemas';
import { wrapValidator } from 'shared/tsUtils';
import { PageType } from './pageType';

const ajv = new Ajv({ allErrors: true });
ajv.addVocabulary(['tsType']);

ajv.addKeyword({
  keyword: 'validatePageIsNotEntityView',
  async: true,
  errors: true,
  type: 'object',
  async validate(_fields: any, page: PageType) {
    if (page.sharedId) {
      const templates = await templatesModel.get({
        entityViewPage: page.sharedId,
      });

      if (templates.length > 0 && !page.entityView) {
        const templatesTitles = templates.map(template => template.name);
        throw new Ajv.ValidationError([
          {
            keyword: 'validatePageIsNotEntityView',
            schemaPath: '',
            params: { keyword: 'validatePageIsEntityView', _fields },
            message: `This page is in use by the following templates: ${templatesTitles.join(
              ', '
            )}`,
            instancePath: '.pages',
          },
        ]);
      }
    }
    return true;
  },
});

export const PageSchema = {
  $schema: 'http://json-schema.org/schema#',
  $async: true,
  type: 'object',
  validatePageIsNotEntityView: true,
  additionalProperties: false,
  title: 'PageType',
  definitions: { objectIdSchema },
  properties: {
    _id: objectIdSchema,
    title: { type: 'string' },
    language: { type: 'string' },
    sharedId: { type: 'string' },
    creationDate: { type: 'number' },
    metadata: {
      type: 'object',
      additionalProperties: false,
      definitions: { objectIdSchema },
      properties: {
        _id: objectIdSchema,
        content: { type: 'string' },
        script: { type: 'string' },
      },
    },
    user: objectIdSchema,
    entityView: { type: 'boolean' },
    __v: { type: 'number' },
  },
  required: ['title'],
};

const validatePage = wrapValidator(ajv.compile(PageSchema));
export { validatePage };
export const emitSchemaTypes = true;
