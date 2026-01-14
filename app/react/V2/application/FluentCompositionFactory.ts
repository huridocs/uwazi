import { ProcessingContext } from './services/processors/types';
import { EntityCompositionUseCase } from './useCases/EntityCompositionUseCase';
import { FluentCompositionBuilder } from './FluentCompositionBuilder';

export class FluentCompositionFactory {
  constructor(
    private readonly processingContext: ProcessingContext,
    private readonly useCase?: EntityCompositionUseCase
  ) {}

  createBuilderForRawEntity(): FluentCompositionBuilder {
    return FluentCompositionBuilder.create(this.processingContext);
  }

  createBuilderForEntityId(entityIdOrIds: string | string[]): FluentCompositionBuilder {
    if (!this.useCase) {
      throw new Error('UseCase is required for entity ID processing');
    }
    return FluentCompositionBuilder.createWithUseCase(
      this.processingContext,
      this.useCase,
      entityIdOrIds
    );
  }

  forEntity(entityId: string): FluentCompositionBuilder {
    return this.createBuilderForEntityId(entityId);
  }

  forEntities(entityIds: string[]): FluentCompositionBuilder {
    return this.createBuilderForEntityId(entityIds);
  }

  forRawEntity(): FluentCompositionBuilder {
    return this.createBuilderForRawEntity();
  }
}
