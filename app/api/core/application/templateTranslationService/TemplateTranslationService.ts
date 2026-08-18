import { TranslationsService } from '#api/core/application/translation/TranslationsService.js';
import { Template } from '#api/core/domain/template/Template.js';
import type { TemplateTranslationService as TemplateTranslationServicePort } from '#api/core/domain/template/TemplateTranslationService.js';

type Deps = {
  translationsService: TranslationsService;
};

function createTranslationContext(template: Template) {
  const titleProperty = template.commonProperties.find(p => p.name === 'title');

  const context = template.properties.reduce<{ [k: string]: string }>((ctx, prop) => {
    ctx[prop.label] = prop.label;
    return ctx;
  }, {});

  context[template.name] = template.name;
  context[titleProperty!.label] = titleProperty!.label;
  return context;
}

/**
 * Syncs Template label keys into translation contexts.
 * Must run inside the parent Template UseCase transaction (shared TM), like ThesaurusTranslationService.
 */
class TemplateTranslationService implements TemplateTranslationServicePort {
  constructor(private deps: Deps) {}

  async createTemplateTranslation(template: Template): Promise<void> {
    await this.deps.translationsService.createContext(
      {
        id: template.id,
        label: template.name,
        type: 'Entity',
      },
      createTranslationContext(template)
    );
  }

  async updateTemplateTranslation(currentTemplate: Template, updatedTemplate: Template) {
    const updatedLabels: { [k: string]: string } = {};
    if (currentTemplate.name !== updatedTemplate.name) {
      updatedLabels[currentTemplate.name] = updatedTemplate.name;
    }

    const changedLabels = currentTemplate
      .selectUpdatedProperties(updatedTemplate)
      .filter(update => update.updatedAttributes.includes('label'));

    changedLabels.forEach(change => {
      updatedLabels[change.oldProperty.label] = change.newProperty.label;
    });

    await this.deps.translationsService.updateContext({
      context: {
        id: currentTemplate.id,
        label: updatedTemplate.name,
        type: 'Entity',
      },
      keyChanges: updatedLabels,
      keysToDelete: currentTemplate.selectDeletedProperties(updatedTemplate).map(p => p.label),
      valueChanges: createTranslationContext(updatedTemplate),
    });
  }
}

export { TemplateTranslationService };
