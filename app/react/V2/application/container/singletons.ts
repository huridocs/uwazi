import { EntityRepositoryImpl } from '#V2/infrastructure/index.js';
import { CompositionServiceFactory } from '#V2/application/services/CompositionServiceFactory.js';
import { EntityCompositionUseCase } from '#V2/application/useCases/EntityCompositionUseCase.js';

let _entityCompositionUseCase: EntityCompositionUseCase | null = null;
let _initializationPromise: Promise<EntityCompositionUseCase> | null = null;

export const getEntityCompositionUseCase = async (): Promise<EntityCompositionUseCase> => {
  if (_entityCompositionUseCase) {
    return _entityCompositionUseCase;
  }

  if (_initializationPromise) {
    return _initializationPromise;
  }

  _initializationPromise = CompositionServiceFactory.createCompositionService(
    new EntityRepositoryImpl()
  );
  return _initializationPromise;
};

export const resetEntityCompositionUseCase = (): void => {
  _entityCompositionUseCase = null;
  _initializationPromise = null;
};
