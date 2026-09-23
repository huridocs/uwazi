import { PropagateThesaurusTranslationService } from '#api/core/application/translation/PropagateThesaurusTranslationService.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { ThesauriDataSourceFactory } from './ThesauriDataSourceFactory.js';
import { DispatcherFactory } from '#api/core/infrastructure/factories/DispatcherFactory.js';

export class PropagateThesaurusTranslationServiceFactory {
  static default() {
    return new PropagateThesaurusTranslationService({
      thesauriDS: ThesauriDataSourceFactory.default(),
      dispatcher: DispatcherFactory.default(),
      tenantName: ExecutionContext.tenant.name,
    });
  }
}
