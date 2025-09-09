import { TranslationService } from 'api/core/domain/template/TranslationService';
import { Template } from 'api/templates.v2/model/Template';
import translations from 'api/i18n/translations';
import { TemplateSchema } from 'shared/types/templateType';
import { ContextType } from 'shared/translationSchema';
import { TemplateMapper } from './mapper';

class LegacyTranslationService implements TranslationService {
  async translate(template: Template): Promise<void> {
    const schema = TemplateMapper.toSchema(template);

    await translations.addContext(
      schema._id.toString(),
      schema.name,
      this.createTranslationContext(schema),
      ContextType.entity
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

export { LegacyTranslationService };
