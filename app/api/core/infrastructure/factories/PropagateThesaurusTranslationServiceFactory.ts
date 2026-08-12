import { PropagateThesaurusTranslationService } from '#api/core/application/translation/PropagateThesaurusTranslationService.js';
import { thesaurusMetadataRenamerAdapter } from '#api/core/infrastructure/mongodb/thesauri/ThesaurusMetadataRenamerAdapter.js';
import { ThesauriDataSourceFactory } from './ThesauriDataSourceFactory.js';

export class PropagateThesaurusTranslationServiceFactory {
  static default() {
    return new PropagateThesaurusTranslationService({
      thesauriDS: ThesauriDataSourceFactory.default(),
      metadataRenamer: thesaurusMetadataRenamerAdapter,
    });
  }
}
