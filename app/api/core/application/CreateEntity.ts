import { Entity, EntityIcon } from 'api/core/domain/entity/Entity';
import { InputFile } from 'api/core/domain/files/InputFile';
import { AbstractUseCase } from '../libs/UseCase';
import { EntitiesService } from './EntitiesService';
import { FilesService } from './FilesService';
import { PropertyAssignmentInput } from './propertyAssignmentCreatorService/PropertyAssignmentCreatorService';
import { PropertyAssignmentCreatorServiceStrategy } from './propertyAssignmentCreatorService/PropertyAssignmentCreatorServiceStrategy';

type Input = {
  propertyAssignments: PropertyAssignmentInput[];
  inputFiles: InputFile[];
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
  protected async executeAsync({
    templateId,
    icon,
    propertyAssignments: propertyAssignmentsInput,
    inputFiles,
  }: Input): Promise<Output> {
    const entity = await this.deps.entitiesService.create({
      templateId,
      icon,
      userId: this.actor?.id,
    });

    const propertyAssignments = await this.deps.propertyAssignmentCreatorServiceStrategy.bulkCreate(
      propertyAssignmentsInput,
      entity.template,
      inputFiles.filter(f => f.isAttachment())
    );

    entity.setPropertyAssignmentsInAllLanguages(propertyAssignments, true);

    const attachments = await this.deps.fileService.fromInputFiles(entity.sharedId, inputFiles);

    await this.deps.fileService.storeFiles(attachments);

    await this.transactionManager.run(async () => {
      await this.deps.entitiesService.insert(entity);
      await this.deps.fileService.insert(attachments);
    });

    return entity;
  }
}

export { CreateEntityUseCase };
export type { Input as CreateEntityUseCaseInput };
