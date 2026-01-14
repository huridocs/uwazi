import { EntityRepositoryImpl } from 'app/V2/infrastructure';
import { CompositionServiceFactory } from '../services/CompositionServiceFactory';
import { EntityCompositionUseCase } from '../useCases/EntityCompositionUseCase';

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
