import { EntityRepository } from 'app/V2/infrastructure/repositories/EntityRepository';
import { DependencyContainer } from '../container/DependencyContainer';
import { EntityCompositionUseCase } from '../useCases/EntityCompositionUseCase';

export class CompositionServiceFactory {
  private static container: DependencyContainer | null = null;

  static async createCompositionService(
    repository: EntityRepository
  ): Promise<EntityCompositionUseCase> {
    if (!this.container) {
      this.container = DependencyContainer.getInstance();
      this.container.setRepository(repository);
    }

    return this.container.getEntityCompositionUseCase();
  }

  static reset(): void {
    if (this.container) {
      this.container.reset();
      this.container = null;
    }
  }
}
