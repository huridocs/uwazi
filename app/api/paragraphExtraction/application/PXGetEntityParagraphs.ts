// @ts-expect-error TS(2307): Cannot find module '../common.v2/contracts/UseCase... Remove this comment to see the full error message
import { UseCase } from '../common.v2/contracts/UseCase.js';
// @ts-expect-error TS(2307): Cannot find module '../settings.v2/contracts/Setti... Remove this comment to see the full error message
import { SettingsDataSource } from '../settings.v2/contracts/SettingsDataSource.js';
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
          // @ts-expect-error TS(7006): Parameter 'r' implicitly has an 'any' type.
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
