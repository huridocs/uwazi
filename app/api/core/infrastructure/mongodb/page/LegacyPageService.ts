import Ajv from 'ajv';
import { PageService } from 'api/core/domain/template/PageService';
import pages from 'api/pages';
import { Template } from 'api/core/domain/template/Template';

class LegacyPageService implements PageService {
  // eslint-disable-next-line class-methods-use-this
  async ensurePageIsValid(template: Template): Promise<void> {
    if (!template?.entityViewPage?.length) {
      return;
    }

    const page = await pages.get({ sharedId: template.entityViewPage });

    if (page.length === 0) {
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

    if (!page[0].entityView) {
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
