import { EntityDBO } from '#api/core/infrastructure/mongodb/entity/EntityDBO.js';
import {
  EntityTranslationsRequest,
  UpdateEntityRequest,
} from '#api/core/infrastructure/express/entity/Schemas.js';
import { ATConfigDataSource } from '../contracts/ATConfigDataSource.js';
import { Logger } from '#api/core/libs/logger/contracts/Logger.js';
import { RequestEntityTranslation } from '../RequestEntityTranslation.js';
import { SaveEntityTranslations } from '../SaveEntityTranslations.js';

export class ATConflictSolver {
  constructor(
    private atConfigDS: ATConfigDataSource,
    private logger: Logger
  ) {}

  // eslint-disable-next-line max-statements
  async execute(
    current: EntityDBO,
    updatedEntity: UpdateEntityRequest
  ): Promise<UpdateEntityRequest> {
    const atConfig = await this.atConfigDS.get();
    if (!atConfig.active) {
      return updatedEntity;
    }

    const properties = atConfig.propertiesByTemplate(current.template.toString());
    if (!properties.length) {
      return updatedEntity;
    }

    const resolved: UpdateEntityRequest = { ...updatedEntity };

    for (const property of properties) {
      const propName = property.name;

      if (propName === 'title') {
        const newValue = resolved.title || '';
        const currentValue = current.title || '';
        if (ATConflictSolver.isStalePendingValue(newValue, currentValue)) {
          this.logger.info(
            `[AT] property ${propName} conflict resolved for entity ${current.sharedId}`
          );
          resolved.title = currentValue;
        }
      } else {
        // AT currently only handles single-value text properties.
        // This logic assumes metadata[propName] is a single-element array.
        const newValue = `${resolved.metadata?.[propName]?.[0]?.value ?? ''}`;
        const currentValue = `${current.metadata[propName]?.[0]?.value ?? ''}`;

        if (ATConflictSolver.isStalePendingValue(newValue, currentValue)) {
          this.logger.info(
            `[AT] property ${propName} conflict resolved for entity ${current.sharedId}`
          );
          resolved.metadata = {
            ...resolved.metadata,
            [propName]: [{ ...resolved.metadata![propName][0], value: currentValue }],
          };
        }
      }
    }

    return resolved;
  }

  /**
   * Same rule as `execute`, for the other languages of an update sent with translations: a value
   * still holding the pending marker must not overwrite a finished AI translation.
   */
  async resolveTranslations(
    currentRows: EntityDBO[],
    templateId: string,
    translations: EntityTranslationsRequest
  ): Promise<EntityTranslationsRequest> {
    const atConfig = await this.atConfigDS.get();
    const properties = atConfig.active ? atConfig.propertiesByTemplate(templateId) : [];
    if (!properties.length) return translations;

    return Object.fromEntries(
      Object.entries(translations).map(([language, values]) => {
        const current = currentRows.find(row => row.language === language);
        if (!current) return [language, values];

        const resolved = { ...values };
        properties.forEach(({ name }) => {
          const [first] = resolved[name] ?? [];
          const newValue = `${first?.value ?? ''}`;
          const currentValue = `${
            name === 'title' ? (current.title ?? '') : (current.metadata[name]?.[0]?.value ?? '')
          }`;

          if (first && ATConflictSolver.isStalePendingValue(newValue, currentValue)) {
            this.logger.info(
              `[AT] property ${name} conflict resolved for entity ${current.sharedId} in ${language}`
            );
            resolved[name] = [{ ...first, value: currentValue }];
          }
        });

        return [language, resolved];
      })
    );
  }

  private static isStalePendingValue(newValue: string, currentValue: string) {
    return (
      newValue.startsWith(RequestEntityTranslation.AITranslationPendingText) &&
      currentValue.startsWith(SaveEntityTranslations.AITranslatedText)
    );
  }
}
