import { ThesaurusMetadataRenamer } from '#api/core/application/contracts/ThesaurusMetadataRenamer.js';
import { thesauri } from '#api/core/v1_layer/thesauri/thesauri.js';

export const legacyThesaurusMetadataRenamer: ThesaurusMetadataRenamer = {
  async renameInMetadata(
    valueId: string,
    newLabel: string,
    thesaurusId: string,
    language: string
  ): Promise<void> {
    await thesauri.renameThesaurusInMetadata(valueId, newLabel, thesaurusId, language);
  },
};
