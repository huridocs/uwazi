import Ajv from 'ajv';
import { PageService } from '#api/core/domain/template/PageService.js';
import { Template } from '#api/core/domain/template/Template.js';
import { PagesDataSource } from '#api/pages.v2/application/contracts/PagesDataSource.js';
import { PagesDataSourceFactory } from '../infrastructure/factories/PagesDataSourceFactory.js';

class LegacyPageService implements PageService {
  private readonly pagesDS?: PagesDataSource;

  constructor(pagesDS?: PagesDataSource) {
    this.pagesDS = pagesDS;
  }

  async ensurePageIsValid(template: Template): Promise<void> {
    if (!template?.entityViewPage?.length) {
      return;
    }

    const pagesDS = this.pagesDS ?? PagesDataSourceFactory.default();
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
