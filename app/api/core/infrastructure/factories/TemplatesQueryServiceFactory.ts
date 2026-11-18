import { TemplatesQueryService } from '../template/TemplatesQueryService.js';
import { TemplatesDataSourceFactory } from './TemplatesDataSourceFactory.js';

class TemplatesQueryServiceFactory {
  static default(): TemplatesQueryService {
    return new TemplatesQueryService({ templatesDS: TemplatesDataSourceFactory.default() });
  }
}

export { TemplatesQueryServiceFactory };
