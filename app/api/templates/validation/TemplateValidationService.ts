import { ValidationError } from 'api/common.v2/validation/ValidationError';
import { TemplateSchema } from 'shared/types/templateType';

export class TemplateValidationService {
  async validateTemplateDelete(
    templateToDelete: TemplateSchema,
    entityCount: number
  ): Promise<void> {
    if (templateToDelete.default) {
      return Promise.reject(
        new ValidationError([{ path: '_id', message: 'default_template_cannot_be_deleted' }])
      );
    }
    if (entityCount > 0) {
      return Promise.reject({ key: 'documents_using_template', value: entityCount });
    }
  }
}
