import { z } from 'zod';

import { UseCase } from 'api/common.v2/contracts/UseCase';
import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource';
import { IdGenerator } from 'api/common.v2/contracts/IdGenerator';

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
});

type Dependencies = {
  templatesDS: TemplatesDataSource;
  extractorDS: PXExtractorsDataSource;
  idGenerator: IdGenerator;
};

class PXCreateExtractor implements UseCase<Input, Output> {
  constructor(private dependencies: Dependencies) {}

  async execute(input: Input): Promise<Output> {
    const [targetTemplate, sourceTemplate] = await Promise.all([
      this.dependencies.templatesDS.getById(input.targetTemplateId),
      this.dependencies.templatesDS.getById(input.sourceTemplateId),
    ]);

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

    const extractor = new PXExtractor({
      id: this.dependencies.idGenerator.generate(),
      targetTemplate,
      sourceTemplate,
      paragraphNumberPropertyId: input.paragraphNumberPropertyId,
      paragraphPropertyId: input.paragraphPropertyId,
    });

    await this.dependencies.extractorDS.create(extractor);

    return extractor;
  }
}

export { InputSchema, PXCreateExtractor };

export type { Input };
