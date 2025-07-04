import { ValidationError } from 'api/common.v2/validation/ValidationError';
import { TemplateSchema } from 'shared/types/templateType';
import { TemplateValidationService } from '../TemplateValidationService';

describe('DefaultTemplateDeletionValidationService', () => {
  let validationService: TemplateValidationService;

  beforeEach(() => {
    validationService = new TemplateValidationService();
  });

  describe('validateTemplateDelete', () => {
    it('should throw default_template_cannot_be_deleted when template is default', async () => {
      const defaultTemplate = {
        _id: 'template-id',
        name: 'Default Template',
        default: true,
        properties: [],
        commonProperties: [],
      } as unknown as TemplateSchema;

      await expect(validationService.validateTemplateDelete(defaultTemplate, 0)).rejects.toEqual(
        new ValidationError([{ path: '_id', message: 'default_template_cannot_be_deleted' }])
      );
    });

    it('should throw documents_using_template when template has entities', async () => {
      const template = {
        _id: 'template-id',
        name: 'Test Template',
        default: false,
        properties: [],
        commonProperties: [],
      } as unknown as TemplateSchema;

      await expect(validationService.validateTemplateDelete(template, 5)).rejects.toEqual({
        key: 'documents_using_template',
        value: 5,
      });
    });

    it('should not throw when template is valid for deletion', async () => {
      const template = {
        _id: 'template-id',
        name: 'Test Template',
        default: false,
        properties: [],
        commonProperties: [],
      } as unknown as TemplateSchema;

      await expect(validationService.validateTemplateDelete(template, 0)).resolves.toBeUndefined();
    });
  });
});
