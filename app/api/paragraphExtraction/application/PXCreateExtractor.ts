import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource';
import { IdGenerator } from 'api/common.v2/contracts/IdGenerator';
import relationshipTypeDS from 'api/relationtypes';
import { TransactionManager } from 'api/common.v2/contracts/TransactionManager';
import { UseCase } from 'api/common.v2/contracts/UseCase';
import { JobsDispatcher } from 'api/queue.v2/application/contracts/JobsDispatcher';
import { CreateParagraphExtractionEntityStatusesJob } from '../jobs/CreateParagraphExtractionEntityStatusesJob';

import { PXExtractor } from '../domain/PXExtractor';
import { PXExtractorsDataSource } from '../domain/PXExtractorDataSource';
import { PXErrorCode, PXValidationError } from '../domain/PXValidationError';

type Input = {
  targetTemplateId: string;
  sourceTemplateId: string;
  paragraphPropertyId: string;
  paragraphNumberPropertyId: string;
  sourceRelationshipTypeId: string;
  targetRelationshipTypeId: string;
};

type Output = PXExtractor;

type Dependencies = {
  templatesDS: TemplatesDataSource;
  extractorDS: PXExtractorsDataSource;
  idGenerator: IdGenerator;
  transactionManager: TransactionManager;
  relationshipTypeDS: typeof relationshipTypeDS;
  dispatcher: JobsDispatcher;
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

    if (targetTemplate.isError()) {
      throw new PXValidationError(
        PXErrorCode.TARGET_TEMPLATE_NOT_FOUND,
        `Target template with id ${input.targetTemplateId} was not found`
      );
    }

    if (sourceTemplate.isError()) {
      throw new PXValidationError(
        PXErrorCode.SOURCE_TEMPLATE_NOT_FOUND,
        `Source template with id ${input.sourceTemplateId} was not found`
      );
    }

    return {
      targetTemplate: targetTemplate.getData(),
      sourceTemplate: sourceTemplate.getData(),
      sourceRelationshipTypeId: sourceRelationshipType._id.toString(),
      targetRelationshipTypeId: targetRelationshipType._id.toString(),
    };
  }

  async execute(input: Input): Promise<Output> {
    const { sourceTemplate, targetTemplate, sourceRelationshipTypeId, targetRelationshipTypeId } =
      await this.getInitialData(input);

    const extractorWithSameSourceTemplateExists = await this.dependencies.extractorDS.exists({
      sourceTemplateId: input.sourceTemplateId,
    });

    if (sourceRelationshipTypeId === targetRelationshipTypeId) {
      throw new PXValidationError(
        PXErrorCode.SAME_SOURCE_TARGET_RELATIONTYPE,
        `Canon create an Extractor with the same source and target relationship type: ${sourceRelationshipTypeId}`
      );
    }

    if (extractorWithSameSourceTemplateExists) {
      throw new PXValidationError(
        PXErrorCode.EXTRACTOR_ALREADY_EXISTS,
        `Cannot create an Extractor with a source template that already has an Extractor. sourceTemplateId: ${input.sourceTemplateId}`
      );
    }

    const extractor = new PXExtractor({
      id: this.dependencies.idGenerator.generate(),
      targetTemplate,
      sourceTemplate,
      paragraphNumberPropertyId: input.paragraphNumberPropertyId,
      paragraphPropertyId: input.paragraphPropertyId,
      sourceRelationshipTypeId,
      targetRelationshipTypeId,
    });

    await this.dependencies.transactionManager.run(async () => {
      await this.dependencies.extractorDS.create(extractor);
    });

    await this.dependencies.dispatcher.dispatch(CreateParagraphExtractionEntityStatusesJob, {
      extractorId: extractor.id,
      sourceTemplateId: extractor.sourceTemplate.id,
    });

    return extractor;
  }
}

export { PXCreateExtractor };

export type { Input };
