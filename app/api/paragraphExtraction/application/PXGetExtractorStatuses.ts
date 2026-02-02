import { LanguageISO6391 } from '#shared/types/commonTypes.js';

import { UseCase } from '#api/core/libs/UseCase.js';

import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';

import { FilesDataSource } from '#api/core/application/contracts/FilesDataSource.js';

import {
  GetExtractorStatusesInput,
  GetExtractorStatusesOutput,
  PXExtractorsQueryService,
} from '#api/paragraphExtraction/domain/PXExtractorsQueryService.js';

type PXGetExtractorStatusesOutput = Omit<GetExtractorStatusesOutput, 'rows'> & {
  rows: (GetExtractorStatusesOutput['rows'][0] & {
    availableFileLanguages: LanguageISO6391[];
    paragraphsCount: number;
  })[];
};

type Dependencies = {
  extractorsQueryService: PXExtractorsQueryService;
  settingsDS: SettingsDataSource;
  filesDS: FilesDataSource;
};

class PXGetExtractorStatuses
  implements UseCase<GetExtractorStatusesInput, PXGetExtractorStatusesOutput> {
  constructor(private dependencies: Dependencies) { }

  async execute(input: GetExtractorStatusesInput): Promise<PXGetExtractorStatusesOutput> {
    const { extractorsQueryService, settingsDS, filesDS } = this.dependencies;

    const results = (await extractorsQueryService
      .getExtractorStatuses(input)
      .first()) as PXGetExtractorStatusesOutput;

    const installedLanguages = (await settingsDS.getInstalledLanguages()).map(l => l.key);

    await results?.rows.reduce(async (prev, _row) => {
      const row = _row;
      await prev;

      const entityValidFiles = await filesDS
        .getProcessedDocsForEntity(row.entity.sharedId, { languages: installedLanguages })
        .all();

      row.availableFileLanguages = [...new Set(entityValidFiles.map(f => f.language))];

      const entityParagraphRelationships = await extractorsQueryService
        .getEntityParagraphRelationships({ id: row.entity.sharedId, extractorId: input.id })
        .all();

      row.paragraphsCount = entityParagraphRelationships.length;
    }, Promise.resolve());

    return results;
  }
}

export { PXGetExtractorStatuses };
