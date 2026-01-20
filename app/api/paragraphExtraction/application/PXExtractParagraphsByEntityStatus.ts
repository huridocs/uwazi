import { UseCase } from '#api/core/libs/UseCase.js';
import { EntityStatus } from '#api/paragraphExtraction/domain/PXEntityStatusModel.js';

import { PXEntitiesStatusDataSource } from '#api/paragraphExtraction/domain/PXEntitiesStatusDataSource.js';
import { PXExtractParagraphsFromEntities } from '#api/paragraphExtraction/application/PXExtractParagraphFromEntities.js';

type Input = {
  userId: string;
  extractorId: string;
  status: EntityStatus;
};

type Output = any;

type Dependencies = {
  entitiesStatusDS: PXEntitiesStatusDataSource;
  extractParagraphsFromEntities: PXExtractParagraphsFromEntities;
};

class PXExtractParagraphsByEntityStatus implements UseCase<Input, Output> {
  constructor(private dependencies: Dependencies) {}

  async execute({ extractorId, status, userId }: Input): Promise<Output> {
    const entitiesStatus = await this.dependencies.entitiesStatusDS
      .getAll({ extractorId, status })
      .all();

    await this.dependencies.extractParagraphsFromEntities.execute({
      userId,
      extractorId,
      entitySharedIds: entitiesStatus.map(e => e.entitySharedId),
    });
  }
}

export { PXExtractParagraphsByEntityStatus };

export type { Input };
