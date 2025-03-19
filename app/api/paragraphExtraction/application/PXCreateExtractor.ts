import { z } from 'zod';

import { UseCase } from 'api/common.v2/contracts/UseCase';
import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource';
import { IdGenerator } from 'api/common.v2/contracts/IdGenerator';
import relationshipTypeDS from 'api/relationtypes';

import { PXExtractor } from '../domain/PXExtractor';
import { PXExtractorsDataSource } from '../domain/PXExtractorDataSource';
import { PXErrorCode, PXValidationError } from '../domain/PXValidationError';

type Input = z.infer<typeof InputSchema>;
type Output = PXExtractor;

const InputSchema = z.object({
  targetTemplateId: z.string({ message: 'You should provide a target template' }),
  sourceTemplateId: z.string({ message: 'You should provide a source template' }),
  paragraphPropertyId: z.string(),
  paragraphNumberPropertyId: z.string(),
  sourceRelationshipTypeId: z.string(),
  targetRelationshipTypeId: z.string(),
});

type Dependencies = {
  templatesDS: TemplatesDataSource;
  extractorDS: PXExtractorsDataSource;
  idGenerator: IdGenerator;
  relationshipTypeDS: typeof relationshipTypeDS;
};

class PXCreateExtractor implements UseCase<Input, Output> {
  constructor(private dependencies: Dependencies) {}

  private async getInitialData(input: Input) {
    const [targetTemplate, sourceTemplate, sourceRelationshipType, targetRelationshipType] =
      await Promise.all([
        this.dependencies.templatesDS.getById(input.targetTemplateId),
        this.dependencies.templatesDS.getById(input.sourceTemplateId),
        this.dependencies.relationshipTypeDS.getById(input.sourceRelationshipTypeId),
        this.dependencies.relationshipTypeDS.getById(input.targetRelationshipTypeId),
      ]);

    if (!sourceRelationshipType) {
      throw new PXValidationError(
        PXErrorCode.SOURCE_RELATIONSHIP_TYPE_DOES_NOT_EXIST,
        'Cannot create an Extractor with a Source relationship type that does not exist'
      );
    }

    if (!targetRelationshipType) {
      throw new PXValidationError(
        PXErrorCode.TARGET_RELATIONSHIP_TYPE_DOES_NOT_EXIST,
        'Cannot create an Extractor with a Target relationship type that does not exist'
      );
    }

    if (!targetTemplate) {
      throw new PXValidationError(
        PXErrorCode.TARGET_TEMPLATE_NOT_FOUND,
        `Target template with id ${input.targetTemplateId} was not found`
      );
    }

    if (!sourceTemplate) {
      throw new PXValidationError(
        PXErrorCode.SOURCE_TEMPLATE_NOT_FOUND,
        `Source template with id ${input.sourceTemplateId} was not found`
      );
    }

    return {
      targetTemplate,
      sourceTemplate,
      sourceRelationshipTypeId: sourceRelationshipType._id.toString(),
      targetRelationshipTypeId: targetRelationshipType._id.toString(),
    };
  }

  async execute(input: Input): Promise<Output> {
    const { sourceTemplate, targetTemplate, sourceRelationshipTypeId, targetRelationshipTypeId } =
      await this.getInitialData(input);

    const extractor = new PXExtractor({
      id: this.dependencies.idGenerator.generate(),
      targetTemplate,
      sourceTemplate,
      paragraphNumberPropertyId: input.paragraphNumberPropertyId,
      paragraphPropertyId: input.paragraphPropertyId,
      sourceRelationshipTypeId,
      targetRelationshipTypeId,
    });

    await this.dependencies.extractorDS.create(extractor);

    return extractor;
  }
}

export { InputSchema, PXCreateExtractor };

export type { Input };
