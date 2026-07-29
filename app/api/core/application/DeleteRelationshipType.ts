import { ObjectId } from 'mongodb';
import templates from '#api/core/v1_layer/templates/index.js';
import relationships from '#api/relationships/relationships.js';
import * as relationshipsV2Support from '#api/relationships.v2/relationtypes/v2_support.js';
import { createError } from '#api/utils/index.js';
import { AbstractUseCase } from '../libs/UseCase.js';
import type { RelationshipTypesDataSource } from './contracts/RelationshipTypesDataSource.js';
import type { RelationshipTypesTranslationService } from './contracts/RelationshipTypesTranslationService.js';

type Input = {
  id: string;
};

type Output = boolean;

type Deps = {
  relationshipTypesDS: RelationshipTypesDataSource;
  translationService: RelationshipTypesTranslationService;
};

const validateTypeInTemplates = async (id: string) => {
  const templatesUsingType = (await templates.findUsingRelationTypeInProp(id)) as Array<{
    name: string;
  }>;
  if (templatesUsingType.length > 0) {
    const templatesNames = templatesUsingType.map(t => t.name).join(', ');
    throw createError(`Cannot delete type being used in templates: ${templatesNames}`, 400);
  }
};

const validateTypeInRelationships = async (id: string) => {
  const relationTypeObjectId = new ObjectId(id);
  const connectionCount = await relationships.countByRelationType(id);
  const newRelationshipCount =
    await relationshipsV2Support.getNewRelationshipCount(relationTypeObjectId);
  const relationTypeIsUsedInQueries =
    await relationshipsV2Support.relationTypeIsUsedInQueries(relationTypeObjectId);

  if (connectionCount > 0 || newRelationshipCount > 0) {
    throw createError('Cannot delete type being used in relationships', 400);
  }

  if (relationTypeIsUsedInQueries) {
    throw createError('Cannot delete type being used in relationship queries', 400);
  }
};

class DeleteRelationshipTypeUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute(input: Input): Promise<Output> {
    await validateTypeInTemplates(input.id);
    await validateTypeInRelationships(input.id);

    await this.transactionManager.run(async () => {
      await this.deps.translationService.delete(input.id);
      await this.deps.relationshipTypesDS.delete(input.id);
    });
    return true;
  }
}

export { DeleteRelationshipTypeUseCase };
export type { Input as DeleteRelationshipTypeUseCaseInput };
