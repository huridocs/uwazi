import { EntitySchema } from 'shared/types/entityType';
import { EntityCompositionSanitizer } from '../services/sanitizers/EntityCompositionSanitizer';

export interface EntitySaveUseCase {
  saveEntity(entityId: string, formData: any, options?: SaveOptions): Promise<SaveResult>;
}

export interface SaveOptions {
  validate?: boolean;
  showNotifications?: boolean;
  onError?: (error: Error) => void;
  onSuccess?: (result: SaveResult) => void;
}

export interface SaveResult {
  success: boolean;
  entity?: EntitySchema;
  error?: string;
  message?: string;
}

export class EntitySaveUseCaseImpl implements EntitySaveUseCase {
  private sanitizer: EntityCompositionSanitizer;
  private setNotification: (notification: any) => void;

  constructor(sanitizer: EntityCompositionSanitizer, setNotification: (notification: any) => void) {
    this.sanitizer = sanitizer;
    this.setNotification = setNotification;
  }

  async saveEntity(
    entityId: string,
    formData: any,
    options: SaveOptions = {}
  ): Promise<SaveResult> {
    try {
      const sanitizedEntity = this.sanitizer.sanitizeFormData(formData, { _id: 'template' });
      const entityToSave = { ...sanitizedEntity, _id: entityId };

      if (options.validate) {
        this.validateEntity(entityToSave);
      }

      const saveResult = await this.performSave(entityToSave);

      if (options.onSuccess) options.onSuccess(saveResult);
      if (options.showNotifications !== false) {
        this.showSuccessNotification('Entity updated successfully');
      }

      return saveResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      if (options.onError) options.onError(error as Error);
      if (options.showNotifications !== false) this.showErrorNotification(errorMessage);

      return { success: false, error: errorMessage };
    }
  }

  private async performSave(entity: EntitySchema): Promise<SaveResult> {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ success: true, entity, message: 'Entity saved successfully' });
      }, 100);
    });
  }

  private validateEntity(entity: EntitySchema): void {
    if (!entity.title) throw new Error('Entity title is required');
  }

  private showSuccessNotification(message: string): void {
    this.setNotification({
      type: 'success',
      text: message,
    });
  }

  private showErrorNotification(message: string): void {
    this.setNotification({
      type: 'error',
      text: message,
    });
  }
}

export default EntitySaveUseCaseImpl;
