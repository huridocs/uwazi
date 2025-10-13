import React, { useState, useCallback, useContext, createContext } from 'react';
import { EntityCompositionUseCase } from '../application/useCases/EntityCompositionUseCase';
import { CompositionOptions } from '../domain/entities/types';
import { Entity } from 'app/V2/domain/entities/Entity';
import { IncomingHttpHeaders } from 'http';

const EntityCompositionContext = createContext<{
  useCase: EntityCompositionUseCase;
} | null>(null);

export const EntityCompositionProvider: React.FC<{
  children: React.ReactNode;
  useCase: EntityCompositionUseCase;
}> = ({ children, useCase }) => {
  return React.createElement(EntityCompositionContext.Provider, { value: { useCase } }, children);
};

const useEntityCompositionContext = () => {
  const context = useContext(EntityCompositionContext);
  if (!context) {
    throw new Error('useEntityComposition must be used within EntityCompositionProvider');
  }
  return context;
};

export const useEntityComposition = (useCase?: EntityCompositionUseCase) => {
  const context = useEntityCompositionContext();
  const actualUseCase = useCase || context.useCase;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const composeEntity = useCallback(
    async (
      entityId: string,
      options: CompositionOptions,
      headers: IncomingHttpHeaders
    ): Promise<Entity | null> => {
      setLoading(true);
      setError(null);

      try {
        const result = await actualUseCase.composeEntity(entityId, options, { headers });
        if (result.success) {
          return result.entity;
        }
        setError(result.error || 'Failed to compose entity');
        return null;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [actualUseCase]
  );

  const composeEntities = useCallback(
    async (
      entityIds: string[],
      options: CompositionOptions,
      headers: IncomingHttpHeaders
    ): Promise<Entity[]> => {
      setLoading(true);
      setError(null);

      try {
        const result = await actualUseCase.composeEntities(entityIds, options, { headers });
        if (result.success) {
          return result.entities;
        }
        setError('Failed to compose entities');
        return [];
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [actualUseCase]
  );

  return {
    composeEntity,
    composeEntities,
    loading,
    error,
    clearError: () => setError(null),
  };
};

// Fluent API hook
export const useFluentEntityComposition = (_useCase?: EntityCompositionUseCase) => {
  const context = useEntityCompositionContext();
  const useCase = _useCase || context.useCase;

  const [loading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fluentForEntity = useCallback(
    async (entityId: string, options: CompositionOptions, headers: IncomingHttpHeaders) => {
      return useCase.composeEntity(entityId, options, { headers });
    },
    [useCase]
  );

  const fluentForEntities = useCallback(
    async (entityIds: string[], options: CompositionOptions, headers: IncomingHttpHeaders) => {
      return useCase.composeEntities(entityIds, options, { headers });
    },
    [useCase]
  );

  return {
    fluentForEntity,
    fluentForEntities,
    loading,
    error,
    clearError: () => setError(null),
  };
};
