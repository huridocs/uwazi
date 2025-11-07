import { LanguageISO6391 } from 'shared/types/commonTypes';

import { UseCase } from 'api/core/libs/UseCase';
import { SettingsDataSource } from 'api/core/application/contracts/SettingsDataSource';
import { FilesDataSource } from 'api/files.v2/contracts/FilesDataSource';

import {
  GetExtractorStatusesInput,
  GetExtractorStatusesOutput,
  PXExtractorsQueryService,
} from '../domain/PXExtractorsQueryService';

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
  implements UseCase<GetExtractorStatusesInput, PXGetExtractorStatusesOutput>
{
  constructor(private dependencies: Dependencies) {}

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
