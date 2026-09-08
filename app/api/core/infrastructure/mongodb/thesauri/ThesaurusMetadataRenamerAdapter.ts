import { ThesaurusMetadataRenamer } from '#api/core/application/contracts/ThesaurusMetadataRenamer.js';
import { isPostgresCoreActive } from '#api/core/libs/featureFlags.js';
import { denormalizeThesauriLabelInMetadata } from '#api/entities/denormalize.js';

export const thesaurusMetadataRenamerAdapter: ThesaurusMetadataRenamer = {
  async renameInMetadata(
    valueId: string,
    newLabel: string,
    thesaurusId: string,
    language: string
  ): Promise<void> {
    // Deferred for the Postgres pipeline: with postgresCore active the
    // denormalized labels live in the Postgres entities collection, so writing
    // them into Mongo is a stale no-op.
    if (isPostgresCoreActive()) {
      return;
    }
    await denormalizeThesauriLabelInMetadata(valueId, newLabel, thesaurusId, language);
  },
};
