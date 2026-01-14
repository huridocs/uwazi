import { Entity, EntityIcon } from 'api/core/domain/entity/Entity';
import { InputFile } from 'api/core/infrastructure/files/InputFile';
import { AbstractUseCase } from '../libs/UseCase';
import { EntitiesService } from './EntitiesService';
import { FilesService } from './FilesService';
import { PropertyAssignmentInput } from './propertyAssignmentCreatorService/PropertyAssignmentCreatorService';
import { PropertyAssignmentCreatorServiceStrategy } from './propertyAssignmentCreatorService/PropertyAssignmentCreatorServiceStrategy';

type Input = {
  propertyAssignments: PropertyAssignmentInput[];
  inputFiles?: InputFile[];
  templateId?: string;
  icon?: EntityIcon;
};

type Output = Entity;

type Deps = {
  fileService: FilesService;
  entitiesService: EntitiesService;
  propertyAssignmentCreatorServiceStrategy: PropertyAssignmentCreatorServiceStrategy;
};

class CreateEntityUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute(input: Input): Promise<Output> {
    const entity = await this.deps.entitiesService.create({
      templateId: input.templateId,
      icon: input.icon,
      userId: this.actor?.id,
    });

    const propertyAssignments = await this.deps.propertyAssignmentCreatorServiceStrategy.bulkCreate(
      input.propertyAssignments,
      entity.template,
      input?.inputFiles?.filter(f => f.isAttachment()) || []
    );

    entity.setPropertyAssignmentsInAllLanguages(propertyAssignments, true);

    const documentsOrAttachments = (input.inputFiles || []).map(f =>
      f.toEntityFile(entity.sharedId, this.idGenerator.generate())
    );

    await this.deps.fileService.storeFiles(documentsOrAttachments);

    await this.transactionManager.run(async () => {
      await this.deps.entitiesService.insert(entity, {
        actorId: this.actorId,
        tenantName: this.tenant.name,
      });

      await this.deps.fileService.insert(documentsOrAttachments);
    });

    return entity;
  }
}

export { CreateEntityUseCase };
export type { Input as CreateEntityUseCaseInput };
