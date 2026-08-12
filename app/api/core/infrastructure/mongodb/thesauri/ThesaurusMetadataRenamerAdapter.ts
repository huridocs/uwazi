import { ThesaurusMetadataRenamer } from '#api/core/application/contracts/ThesaurusMetadataRenamer.js';
import { denormalizeThesauriLabelInMetadata } from '#api/entities/denormalize.js';

export const thesaurusMetadataRenamerAdapter: ThesaurusMetadataRenamer = {
  async renameInMetadata(
    valueId: string,
    newLabel: string,
    thesaurusId: string,
    language: string
  ): Promise<void> {
    await denormalizeThesauriLabelInMetadata(valueId, newLabel, thesaurusId, language);
  },
};
