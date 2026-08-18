import { Template } from '#api/core/domain/template/Template.js';

/**
 * Port for syncing Template labels into translation contexts.
 * Implementations must share the Template UseCase transaction boundary.
 */
interface TemplateTranslationService {
  createTemplateTranslation(template: Template): Promise<void>;
  updateTemplateTranslation(currentTemplate: Template, updatedTemplate: Template): Promise<void>;
}

export type { TemplateTranslationService };
