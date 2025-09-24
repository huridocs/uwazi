// @ts-expect-error TS(2307): Cannot find module '../common.v2/contracts/UseCase... Remove this comment to see the full error message
import { UseCase } from '../common.v2/contracts/UseCase.js';
import { EntityStatus } from '../domain/PXEntityStatusModel';

import { PXEntitiesStatusDataSource } from '../domain/PXEntitiesStatusDataSource';
import { PXExtractParagraphsFromEntities } from './PXExtractParagraphFromEntities';

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
      // @ts-expect-error TS(7006): Parameter 'e' implicitly has an 'any' type.
      entitySharedIds: entitiesStatus.map(e => e.entitySharedId),
    });
  }
}

export { PXExtractParagraphsByEntityStatus };

export type { Input };
