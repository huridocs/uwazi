import { PropagateThesaurusTranslationService } from '#api/core/application/translation/PropagateThesaurusTranslationService.js';
import { DispatcherAdapter } from '#api/core/infrastructure/jobs/DispatcherAdapter.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { ThesauriDataSourceFactory } from './ThesauriDataSourceFactory.js';

export class PropagateThesaurusTranslationServiceFactory {
  static default() {
    return new PropagateThesaurusTranslationService({
      thesauriDS: ThesauriDataSourceFactory.default(),
      dispatcher: new DispatcherAdapter(ExecutionContext.jobsDispatcher),
      tenantName: ExecutionContext.tenant.name,
    });
  }
}
