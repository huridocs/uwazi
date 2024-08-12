import { LanguageISO6391 } from 'shared/types/commonTypes';
import { AutomaticTranslationTemplateConfig } from './AutomaticTranslationTemplateConfig';
import { Property } from 'api/templates.v2/model/Property';
import { AutomaticTranslationConfig } from './AutomaticTranslationConfig';

class RawAutomaticTranslationConfig {
  readonly active: boolean;

  readonly templates: AutomaticTranslationTemplateConfig[];

  constructor(active: boolean, templates: AutomaticTranslationTemplateConfig[]) {
    this.active = active;
    this.templates = templates;
  }

  getCompleteConfig(
    languages: LanguageISO6391[],
    validProperties: Property[]
  ): AutomaticTranslationConfig {
    const validPropertiesMap = validProperties.reduce(
      (memo, property) => {
        // eslint-disable-next-line no-param-reassign
        memo[property.id] = property;
        return memo;
      },
      {} as { [k: string]: Property }
    );

    const validPropertiesIds = Object.keys(validPropertiesMap);

    const templates = (this.templates || []).map(
      templateConfig =>
        new AutomaticTranslationTemplateConfig(
          templateConfig.template,
          (templateConfig.properties || []).filter(
            propertyId =>
              validPropertiesIds.includes(propertyId) &&
              validPropertiesMap[propertyId].template === templateConfig.template
          ),
          templateConfig.commonProperties
        )
    );

    return new AutomaticTranslationConfig(this.active, languages, templates);
  }
}

export { RawAutomaticTranslationConfig };
