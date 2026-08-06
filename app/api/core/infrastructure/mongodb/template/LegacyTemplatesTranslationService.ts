import { TranslationService } from '#api/core/domain/template/TranslationService.js';
import { UITranslationNotAvailable } from '#api/i18n/defaultTranslations.js';
import { Template } from '#api/core/domain/template/Template.js';
import { TemplateSchema } from '#shared/types/templateType.js';
import { MongoTemplateMapper } from './MongoTemplateMapper.js';
import { CreateTranslationContextUseCaseFactory } from '#api/core/infrastructure/factories/CreateTranslationContextUseCaseFactory.js';
import { UpdateTranslationContextUseCaseFactory } from '#api/core/infrastructure/factories/UpdateTranslationContextUseCaseFactory.js';
import translations from '#api/i18n/translations.js';

class LegacyTemplatesTranslationService implements TranslationService {
  async createTemplateTranslation(template: Template): Promise<void> {
    const schema = MongoTemplateMapper.toSchema(template);

    await CreateTranslationContextUseCaseFactory.default().execute({
      context: {
        id: schema._id.toString(),
        label: schema.name,
        type: 'Entity',
      },
      values: this.createTranslationContext(schema),
    });
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

    await UpdateTranslationContextUseCaseFactory.default().execute({
      context: {
        id: currentTemplate.id.toString(),
        label: updatedTemplate.name,
        type: 'Entity',
      },
      keyChanges: updatedLabels,
      keysToDelete: currentTemplate.selectDeletedProperties(updatedTemplate).map(p => p.label),
      valueChanges: this.createTranslationContext(MongoTemplateMapper.toSchema(updatedTemplate)),
    });
  }

  // eslint-disable-next-line class-methods-use-this
  private createTranslationContext = (template: TemplateSchema) => {
    const titleProperty = template!.commonProperties!.find(p => p.name === 'title');

    const context = (template.properties || []).reduce<{ [k: string]: string }>((ctx, prop) => {
      ctx[prop.label] = prop.label;
      return ctx;
    }, {});

    context[template.name] = template.name;
    context[titleProperty!.label] = titleProperty!.label;
    return context;
  };

  // eslint-disable-next-line class-methods-use-this
  async importPredefined(locale: string): Promise<void> {
    try {
      await translations.importPredefined(locale);
    } catch (error) {
      if (!(error instanceof UITranslationNotAvailable)) throw error;
    }
  }
}

export { LegacyTemplatesTranslationService as LegacyTranslationService };
