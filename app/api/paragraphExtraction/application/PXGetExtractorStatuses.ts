import { LanguageISO6391 } from 'shared/types/commonTypes';
import { LanguageUtils } from 'shared/language/languageUtils';

import { UseCase } from 'api/common.v2/contracts/UseCase';
import { SettingsDataSource } from 'api/settings.v2/contracts/SettingsDataSource';
import { FilesDataSource } from 'api/files.v2/contracts/FilesDataSource';

import {
  GetExtractorStatusesInput,
  GetExtractorStatusesOutput,
  PXExtractorsQueryService,
} from '../domain/PXExtractorsQueryService';

type PXGetExtractorStatusesOutput = Omit<GetExtractorStatusesOutput, 'rows'> & {
  rows: (GetExtractorStatusesOutput['rows'][0] & {
    availableLanguages: LanguageISO6391[];
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

    const installedLanguages = await settingsDS.getInstalledLanguages();
    const installedDocumentLangauges = installedLanguages.map(l => l.ISO639_3);

    await results?.rows.reduce(async (prev, _row) => {
      const row = _row;
      await prev;

      const entityFiles = await filesDS.getDocumentsForEntity(row.entity.sharedId).all();
      const availableLanguages = entityFiles.reduce((availableLenguagesResult, f) => {
        if (installedDocumentLangauges.includes(f.language)) {
          const languageKey = LanguageUtils.fromISO639_3(f.language).ISO639_1;
          if (languageKey) {
            availableLenguagesResult.add(languageKey);
          }
        }
        return availableLenguagesResult;
      }, new Set<LanguageISO6391>());

      row.availableLanguages = Array.from(availableLanguages);
    }, Promise.resolve());

    return results;
  }
}

export { PXGetExtractorStatuses };
