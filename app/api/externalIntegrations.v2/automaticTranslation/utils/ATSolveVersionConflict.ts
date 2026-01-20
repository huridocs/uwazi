import { DefaultTransactionManager } from '#api/common.v2/database/data_source_defaults.js';
import { Entity } from '#api/entities.v2/model/Entity.js';
import { entityInputDataSchema } from '#api/entities.v2/types/EntityInputDataSchema.js';
import { EntityInputModel } from '#api/entities.v2/types/EntityInputDataType.js';
import { DefaultLogger } from '#api/core/libs/logger/infrastructure/StandardLogger.js';
import { EntitySchema } from '#api/migrations/migrations/143-parse-numeric-fields/types.js';
import { inspect } from 'util';
import { AutomaticTranslationFactory } from '#api/externalIntegrations.v2/automaticTranslation/AutomaticTranslationFactory.js';
import { Validator } from '#api/externalIntegrations.v2/automaticTranslation/infrastructure/Validator.js';
import { RequestEntityTranslation } from '#api/externalIntegrations.v2/automaticTranslation/RequestEntityTranslation.js';
import { SaveEntityTranslations } from '#api/externalIntegrations.v2/automaticTranslation/SaveEntityTranslations.js';

const entityV1ToEntityModel = (entity: EntitySchema) => {
  const inputModelValidator = new Validator<EntityInputModel>(entityInputDataSchema);
  // eslint-disable-next-line no-param-reassign
  entity._id = entity._id?.toString();
  // eslint-disable-next-line no-param-reassign
  entity.template = entity.template?.toString();
  if (inputModelValidator.validate(entity)) {
    return Entity.fromInputModel(entity);
  }
  throw inputModelValidator.getErrors()[0];
};

const entityToEntitySchema = (entity: Entity): EntitySchema => {
  const result = { ...entity } as EntitySchema;
  delete result.obsoleteMetadata;
  return result;
};

export const ATSolveVersionConflict = async (
  _currentEntity: EntitySchema,
  _newEntity: EntitySchema
) => {
  const ATConfig = await AutomaticTranslationFactory.defaultATConfigDataSource(
    TransactionManagerFactory.default()
  ).get();

  if (!ATConfig.active) {
    return _newEntity;
  }

  const currentEntity = entityV1ToEntityModel(_currentEntity);
  let newEntity = entityV1ToEntityModel(_newEntity);

  ATConfig.propertiesByTemplate(currentEntity.template).forEach(p => {
    const currentValue = currentEntity.getPropertyValue(p);
    const newValue = newEntity.getPropertyValue(p);

    if (
      newValue.startsWith(RequestEntityTranslation.AITranslationPendingText) &&
      currentValue.startsWith(SaveEntityTranslations.AITranslatedText)
    ) {
      LoggerFactory.default().info(
        inspect(
          new Error(`[AT] property ${p.name} conflict when trying to save entity ${newEntity._id}`)
        )
      );
      newEntity = newEntity.setPropertyValue(p, currentValue);
    }
  });

  return entityToEntitySchema(newEntity);
};
