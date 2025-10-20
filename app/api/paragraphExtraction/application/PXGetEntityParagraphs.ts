import { UseCase } from 'api/core/libs/UseCase';
import { SettingsDataSource } from 'api/settings.v2/contracts/SettingsDataSource';
import {
  GetExtractedParagraphsOutput,
  PXExtractorsQueryService,
} from '../domain/PXExtractorsQueryService';
import { PXExtractorsDataSource } from '../domain/PXExtractorDataSource';

type PXGetEntityParagraphsInput = {
  id: string;
  extractorId: string;
  page?: { number?: number; size?: number };
};

type Dependencies = {
  extractorsQueryService: PXExtractorsQueryService;
  settingsDS: SettingsDataSource;
  extractorsDS: PXExtractorsDataSource;
};

class PXGetEntityParagraphs
  implements UseCase<PXGetEntityParagraphsInput, GetExtractedParagraphsOutput>
{
  constructor(private dependencies: Dependencies) {}

  async execute(input: PXGetEntityParagraphsInput): Promise<GetExtractedParagraphsOutput> {
    const { extractorsQueryService, settingsDS, extractorsDS } = this.dependencies;

    const entityParagraphRelationships = await extractorsQueryService
      .getEntityParagraphRelationships({ id: input.id, extractorId: input.extractorId })
      .all();

    const mainLanguage = await settingsDS.getDefaultLanguageKey();

    const extractor = await extractorsDS.getById(input.extractorId);

    if (extractor) {
      const paragraphNumberProperty = extractor.paragraphNumberProperty.name;

      const results = (await extractorsQueryService
        .getExtractedParagraphs({
          ids: entityParagraphRelationships.map(r => r.entitySharedId),
          mainLanguage,
          paragraphNumberProperty,
          page: input.page,
        })
        .first()) as GetExtractedParagraphsOutput;

      return results;
    }

    throw new Error('No extractor found');
  }
}

export { PXGetEntityParagraphs };
