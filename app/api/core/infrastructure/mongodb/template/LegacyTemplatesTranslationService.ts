import { TranslationService } from '#api/core/domain/template/TranslationService.js';
import translations from '#api/i18n/translations.js';
import { Template } from '#api/core/domain/template/Template.js';
import { ContextType } from '#shared/translationSchema.js';
import { TemplateSchema } from '#shared/types/templateType.js';
import { MongoTemplateMapper } from './MongoTemplateMapper.js';

class LegacyTemplatesTranslationService implements TranslationService {
  async createTemplateTranslation(template: Template): Promise<void> {
    const schema = MongoTemplateMapper.toSchema(template);

    await translations.addContext(
      schema._id.toString(),
      schema.name,
      this.createTranslationContext(schema),
      ContextType.entity
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

    await translations.updateContext(
      { id: currentTemplate.id.toString(), label: updatedTemplate.name, type: 'Entity' },
      updatedLabels,
      currentTemplate.selectDeletedProperties(updatedTemplate).map(p => p.label),
      this.createTranslationContext(MongoTemplateMapper.toSchema(updatedTemplate))
    );
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
}

export { LegacyTemplatesTranslationService as LegacyTranslationService };
