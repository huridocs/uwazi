import Ajv from 'ajv';

import { wrapValidator } from '#shared/tsUtils.js';
import templates from '#api/core/v1_layer/templates/index.js';
import { PageType } from './pageType.js';
import { PageSchema, PageEditorSchema } from './pageSchema.js';

const ajv = new Ajv({ allErrors: true });
ajv.addVocabulary(['tsType']);

ajv.addKeyword({
  keyword: 'validatePageIsNotEntityView',
  async: true,
  errors: true,
  type: 'object',
  async validate(_fields: any, page: PageType) {
    if (page.sharedId) {
      const templatesUsingPage = await templates.getByEntityViewPage(page.sharedId);

      if (templatesUsingPage.length > 0 && !page.entityView) {
        const templatesTitles = templatesUsingPage.map(template => template.name);
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

const validatePage = wrapValidator(ajv.compile(PageSchema));
const validatePageEditor = wrapValidator(ajv.compile(PageEditorSchema));
export { validatePage, validatePageEditor };
