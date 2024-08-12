import { LanguageISO6391 } from 'shared/types/commonTypes';
import { Property } from 'api/templates.v2/model/Property';
import { ATConfig, ATTemplateConfig } from './ATConfig';

class RawATConfig {
  readonly active: boolean;

  readonly templates: ATTemplateConfig[];

  constructor(active: boolean, templates: ATTemplateConfig[]) {
    this.active = active;
    this.templates = templates;
  }

  getCompleteConfig(languages: LanguageISO6391[], validProperties: Property[]): ATConfig {
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
        new ATTemplateConfig(
          templateConfig.template,
          (templateConfig.properties || []).filter(
            propertyId =>
              validPropertiesIds.includes(propertyId) &&
              validPropertiesMap[propertyId].template === templateConfig.template
          ),
          templateConfig.commonProperties
        )
    );

    return new ATConfig(this.active, languages, templates);
  }
}

export { RawATConfig };
