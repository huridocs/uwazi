import { Entity } from '#api/core/domain/entity/Entity.js';
import { AbstractUseCase } from '../libs/UseCase.js';
import { EntitiesService } from './EntitiesService.js';
import { PropertyAssignmentInput } from './propertyAssignmentCreatorService/PropertyAssignmentCreatorService.js';
import { PropertyAssignmentCreatorServiceStrategy } from './propertyAssignmentCreatorService/PropertyAssignmentCreatorServiceStrategy.js';

type Input = {
  propertyAssignments: PropertyAssignmentInput[];
  templateId?: string;
};

type Output = Entity;

type Deps = {
  entitiesService: EntitiesService;
  propertyAssignmentCreatorServiceStrategy: PropertyAssignmentCreatorServiceStrategy;
};

class CreateEntityFromPDFUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute(input: Input): Promise<Output> {
    const entity = await this.deps.entitiesService.create({
      templateId: input.templateId,
      userId: this.actor?.id,
    });

    const propertyAssignments = await this.deps.propertyAssignmentCreatorServiceStrategy.bulkCreate(
      input.propertyAssignments,
      entity.template
    );

    entity.setPropertyAssignmentsInAllLanguages(propertyAssignments);

    await this.transactionManager.run(async () =>
      this.deps.entitiesService.insert(entity, {
        actorId: this.actorId,
        tenantName: this.tenant.name,
        targetLanguage: this.targetLanguage,
      })
    );

    return entity;
  }
}

export { CreateEntityFromPDFUseCase };
export type { Input as CreateEntityFromPDFUseCaseInput };
