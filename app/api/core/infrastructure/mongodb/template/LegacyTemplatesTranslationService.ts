import { TranslationService } from '../../../domain/template/TranslationService.js';
import translations from '../../../../i18n/translations.js';
// @ts-expect-error TS(2307): Cannot find module '../../../templates.v2/model/Te... Remove this comment to see the full error message
import { Template } from '../../../templates.v2/model/Template.js';
import { ContextType } from '../../../../../shared/translationSchema.js';
import { TemplateSchema } from '../../../../../shared/types/templateType.js';
import { TemplateMapper } from './Mapper.js';

class LegacyTemplatesTranslationService implements TranslationService {
  async createTemplateTranslation(template: Template): Promise<void> {
    const schema = TemplateMapper.toSchema(template);

    await translations.addContext(
      schema._id.toString(),
      // @ts-expect-error TS(2339): Property 'name' does not exist on type 'TemplateDB... Remove this comment to see the full error message
      schema.name,
      // @ts-expect-error TS(2345): Argument of type 'TemplateDBO' is not assignable t... Remove this comment to see the full error message
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
      // @ts-expect-error TS(7006): Parameter 'update' implicitly has an 'any' type.
      .filter(update => update.updatedAttributes.includes('label'));

    const deletedLabels: string[] = [];

    // @ts-expect-error TS(7006): Parameter 'change' implicitly has an 'any' type.
    changedLabels.forEach(change => {
      updatedLabels[change.oldProperty.label] = change.newProperty.label;
      deletedLabels.push(change.oldProperty.label);
    });

    await translations.updateContext(
      { id: currentTemplate.id.toString(), label: updatedTemplate.name, type: 'Entity' },
      updatedLabels,
      deletedLabels.concat(
        // @ts-expect-error TS(7006): Parameter 'p' implicitly has an 'any' type.
        currentTemplate.selectDeletedProperties(updatedTemplate).map(p => p.label)
      ),
      // @ts-expect-error TS(2345): Argument of type 'TemplateDBO' is not assignable t... Remove this comment to see the full error message
      this.createTranslationContext(TemplateMapper.toSchema(updatedTemplate))
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
