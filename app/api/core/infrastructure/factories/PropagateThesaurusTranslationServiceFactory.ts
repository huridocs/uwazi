import { PropagateThesaurusTranslationService } from '#api/core/application/translation/PropagateThesaurusTranslationService.js';
import { legacyThesaurusMetadataRenamer } from '#api/core/infrastructure/mongodb/thesauri/LegacyThesaurusMetadataRenamer.js';
import { ThesauriDataSourceFactory } from './ThesauriDataSourceFactory.js';

export class PropagateThesaurusTranslationServiceFactory {
  static default() {
    return new PropagateThesaurusTranslationService({
      thesauriDS: ThesauriDataSourceFactory.default(),
      metadataRenamer: legacyThesaurusMetadataRenamer,
    });
  }
}
