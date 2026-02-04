import { ATConfig, ATTemplateConfig } from '../model/ATConfig.js';

export interface ATConfigDataSource {
  get(): Promise<ATConfig>;
  update(active: boolean, templatesConfig: ATTemplateConfig[]): Promise<ATConfig>;
}
