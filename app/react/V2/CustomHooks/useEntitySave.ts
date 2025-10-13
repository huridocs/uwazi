import { useState, useCallback } from 'react';
import {
  EntitySaveUseCase,
  SaveOptions,
  SaveResult,
} from '../application/useCases/EntitySaveUseCase';

export interface UseEntitySaveReturn {
  saveEntity: (entityId: string, formData: any, options?: SaveOptions) => Promise<SaveResult>;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  clearMessages: () => void;
}

export function useEntitySave(useCase: EntitySaveUseCase): UseEntitySaveReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
  }, []);

  const saveEntity = useCallback(
    async (entityId: string, formData: any, options: SaveOptions = {}): Promise<SaveResult> => {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      try {
        const saveResult = await useCase.saveEntity(entityId, formData, {
          ...options,
          onSuccess: successResult => {
            setSuccessMessage(successResult.message || 'Entity saved successfully');
            options.onSuccess?.(successResult);
          },
          onError: errorResult => {
            setError(errorResult.message);
            options.onError?.(errorResult);
          },
        });

        return saveResult;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [useCase]
  );

  return { saveEntity, loading, error, successMessage, clearMessages };
}

export default useEntitySave;
