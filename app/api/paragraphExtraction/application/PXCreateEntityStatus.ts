import { UseCase } from 'api/common.v2/contracts/UseCase';
import { FilesDataSource } from 'api/files.v2/contracts/FilesDataSource';
import { SettingsDataSource } from 'api/settings.v2/contracts/SettingsDataSource';

import { PXExtractorsDataSource } from '../domain/PXExtractorDataSource';
import { PXEntitiesStatusDataSource } from '../domain/PXEntitiesStatusDataSource';

type Input = {
  sourceTemplateId: string;
  entitySharedId: string;
};

type Output = any;

type Dependencies = {
  entitiesStatusDS: PXEntitiesStatusDataSource;
  extractorsDS: PXExtractorsDataSource;
  filesDS: FilesDataSource;
  settingsDS: SettingsDataSource;
};

class PXCreateEntityStatus implements UseCase<Input, Output> {
  constructor(private dependencies: Dependencies) {}

  async execute(input: Input): Promise<Output> {
    const { entitiesStatusDS, filesDS, extractorsDS } = this.dependencies;

    const extractor = await extractorsDS.getBySourceTemplate(input.sourceTemplateId);

    if (!extractor) {
      return;
    }

    const documents = await filesDS.getDocumentsForEntityInUILanguages(input.entitySharedId);

    if (!documents.length) {
      return;
    }

    await entitiesStatusDS.create({
      extractorId: extractor?.id,
      entitySharedId: input.entitySharedId,
    });
  }
}

export { PXCreateEntityStatus };
