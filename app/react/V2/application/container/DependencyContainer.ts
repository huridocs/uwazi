import { getStore } from '#shared/atomStore/index.js';
import { EntityCompositionUseCase } from '../useCases/EntityCompositionUseCase.js';
import { EntityRepository } from '#V2/infrastructure/repositories/EntityRepository.js';

export class DependencyContainer {
  private static instance: DependencyContainer;
  private repository: EntityRepository | null = null;
  private entityCompositionUseCase: EntityCompositionUseCase | null = null;

  private constructor() {}

  static getInstance(): DependencyContainer {
    if (!DependencyContainer.instance) {
      DependencyContainer.instance = new DependencyContainer();
    }
    return DependencyContainer.instance;
  }

  setRepository(repository: EntityRepository): void {
    this.repository = repository;
  }

  getRepository(): EntityRepository {
    if (!this.repository) {
      throw new Error('Repository not registered');
    }
    return this.repository;
  }

  getEntityCompositionUseCase(): EntityCompositionUseCase {
    if (!this.entityCompositionUseCase) {
      const atomStore = getStore();
      this.entityCompositionUseCase = new EntityCompositionUseCase(this.getRepository(), atomStore);
    }
    return this.entityCompositionUseCase;
  }

  reset(): void {
    this.repository = null;
    this.entityCompositionUseCase = null;
  }
}
