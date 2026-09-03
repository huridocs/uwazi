export interface TemplatesPageUsageDataSource {
  getTemplateNamesUsingPageAsEntityView(pageSharedId: string): Promise<string[]>;
}
