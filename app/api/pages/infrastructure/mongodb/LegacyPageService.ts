import Ajv from 'ajv';
import { PageService } from '#api/core/domain/template/PageService.js';
import { Template } from '#api/core/domain/template/Template.js';
import { PagesDataSourceFactory } from '../factories/PagesDataSourceFactory.js';

class LegacyPageService implements PageService {
  // eslint-disable-next-line class-methods-use-this
  async ensurePageIsValid(template: Template): Promise<void> {
    if (!template?.entityViewPage?.length) {
      return;
    }

    const pagesDS = PagesDataSourceFactory.default();
    const result = await pagesDS.getBySharedId(template.entityViewPage);

    if (result.isError()) {
      throw new Ajv.ValidationError([
        {
          keyword: 'entityViewPageExists',
          schemaPath: '',
          params: { keyword: 'entityViewPageExists' },
          message: 'The selected page does not exist',
          instancePath: '.templates',
        },
      ]);
    }

    const page = result.getDataOrThrow();

    if (!page.entityView) {
      throw new Ajv.ValidationError([
        {
          keyword: 'entityViewPageIsEnabled',
          schemaPath: '',
          params: { keyword: 'entityViewPageIsEnabled' },
          message: 'The selected page is not enabled for entity view',
          instancePath: '.templates',
        },
      ]);
    }
  }
}

export { LegacyPageService };
