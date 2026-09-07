import templates from '#api/core/v1_layer/templates/index.js';
import { TemplatesPageUsageDataSource } from '#api/pages.v2/application/contracts/TemplatesPageUsageDataSource.js';

class LegacyTemplatesPageUsageDataSource implements TemplatesPageUsageDataSource {
  // eslint-disable-next-line class-methods-use-this
  async getTemplateNamesUsingPageAsEntityView(pageSharedId: string): Promise<string[]> {
    const templatesUsingPage = await templates.getByEntityViewPage(pageSharedId);
    return templatesUsingPage.map((template: { name: string }) => template.name);
  }
}

export { LegacyTemplatesPageUsageDataSource };
