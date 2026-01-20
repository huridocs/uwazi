import { ATConfig, ATTemplateConfig } from '#api/externalIntegrations.v2/automaticTranslation/model/ATConfig.js';

export interface ATConfigDataSource {
  get(): Promise<ATConfig>;
  update(active: boolean, templatesConfig: ATTemplateConfig[]): Promise<ATConfig>;
}
