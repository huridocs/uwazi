import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { Entity } from 'api/entities.v2/model/Entity';
import { entityInputDataSchema } from 'api/entities.v2/types/EntityInputDataSchema';
import { EntityInputModel } from 'api/entities.v2/types/EntityInputDataType';
import { LoggerFactory } from 'api/core/infrastructure/factories/LoggerFactory';
import { EntitySchema } from 'api/migrations/migrations/143-parse-numeric-fields/types';
import { inspect } from 'util';
import { AutomaticTranslationFactory } from '../AutomaticTranslationFactory';
import { Validator } from '../infrastructure/Validator';
import { RequestEntityTranslation } from '../RequestEntityTranslation';
import { SaveEntityTranslations } from '../SaveEntityTranslations';

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
