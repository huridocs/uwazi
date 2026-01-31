import Ajv from 'ajv';
import templatesModel from '#api/core/v1_layer/templates/templatesModel.js';
import { wrapValidator } from '#shared/tsUtils.js';
import { PageType } from './pageType.js';
import { PageSchema } from './pageSchema.js';

const ajv = new Ajv({ allErrors: true });
ajv.addVocabulary(['tsType']);

ajv.addKeyword({
  keyword: 'validatePageIsNotEntityView',
  async: true,
  errors: true,
  type: 'object',
  async validate(_fields: unknown, page: PageType) {
    if (page.sharedId) {
      const templates = await templatesModel.get({ entityViewPage: page.sharedId });
      if (templates.length > 0 && !page.entityView) {
        const templatesTitles = templates.map(template => template.name);
        throw new Ajv.ValidationError([
          {
            keyword: 'validatePageIsNotEntityView',
            schemaPath: '',
            params: { keyword: 'validatePageIsEntityView', _fields },
            message: `This page is in use by the following templates: ${templatesTitles.join(', ')}`,
            instancePath: '.pages',
          },
        ]);
      }
    }
    return true;
  },
});

export const validatePage = wrapValidator(ajv.compile(PageSchema));
