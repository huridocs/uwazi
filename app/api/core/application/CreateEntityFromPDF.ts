import { Entity } from '#api/core/domain/entity/Entity.js';
import { CannotCreateEntityFromNonPDFError } from '../domain/entity/errors.js';
import { PDFDocument } from '../domain/files/PDFDocument.js';
import { InputFile } from '../infrastructure/files/InputFile.js';
import { AbstractUseCase } from '../libs/UseCase.js';
import { EntitiesService } from './EntitiesService.js';
import { FilesService } from './FilesService.js';
import { PropertyAssignmentCreatorServiceStrategy } from './propertyAssignmentCreatorService/PropertyAssignmentCreatorServiceStrategy.js';

type Input = {
  templateId?: string;
  inputFile: InputFile;
};

type Output = Entity;

type Deps = {
  entitiesService: EntitiesService;
  filesService: FilesService;
  propertyAssignmentCreatorServiceStrategy: PropertyAssignmentCreatorServiceStrategy;
};

class CreateEntityFromPDFUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute(input: Input): Promise<Output> {
    const entity = await this.deps.entitiesService.create({
      templateId: input.templateId,
      userId: this.actor?.id,
    });

    const document = input.inputFile.toEntityFile(entity.sharedId, this.idGenerator.generate());
    if (!(document instanceof PDFDocument)) {
      throw new CannotCreateEntityFromNonPDFError();
    }

    const propertyAssignments = await this.deps.propertyAssignmentCreatorServiceStrategy.bulkCreate(
      [
        {
          name: 'title',
          language: this.targetLanguage,
          value: [{ value: document.originalname }],
        },
      ],
      entity.template
    );

    entity.setPropertyAssignmentsInAllLanguages(propertyAssignments);

    await this.deps.filesService.storeFiles([document]);

    await this.transactionManager.run(async () => {
      await this.deps.entitiesService.insert(entity, {
        actorId: this.actorId,
        tenantName: this.tenant.name,
        targetLanguage: this.targetLanguage,
      });

      await this.deps.filesService.insert([document]);
    });

    return entity;
  }
}

export { CreateEntityFromPDFUseCase };
export type { Input as CreateEntityFromPDFUseCaseInput };
