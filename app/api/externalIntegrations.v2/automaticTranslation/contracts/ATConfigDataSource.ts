import { ATConfig, ATTemplateConfig } from '../model/ATConfig';

export interface ATConfigDataSource {
  get(): Promise<ATConfig>;
  update(active: boolean, templatesConfig: ATTemplateConfig[]): Promise<ATConfig>;
}
