import { Template } from 'api/templates.v2/model/Template';

interface TranslationService {
  /**
   * Translations might have or not (don't know yet) its own life cycle (reconstruct from persistence, mutate and preserve again on persistence)
   * and of course have an Identity.
   *
   * On Templates domain modules, we gain access to all functionally of Translations through an API, the TranslationService.
   *
   * Which means, the translation makes part of Use Case Transaction, they share same transaction boundary, the same Session.
   *
   * We could totally decouple this use Events:
   *
   * TemplateCreatedEvent -> AddContentHandler (listen to TemplateCreatedEvent) -> executes the AddContextUseCase
   * (creating another transaction on persistence)
   *
   * That way we can not use anymore the term `TranslationService`, a domain service. Because all is decoupled.
   */
  createTemplateTranslation(template: Template): Promise<void>;
  updateTemplateTranslation(currentTemplate: Template, updatedTemplate: Template): Promise<void>;
}

export type { TranslationService };
