/* eslint-disable max-classes-per-file */
import { EntityDBO } from 'api/entities.v2/database/schemas/EntityTypes';
import { Entity } from 'api/core/domain/entity/Entity';
import { ObjectId } from 'mongodb';
import { Template } from 'api/core/domain/template/Template';
import { EntityTranslationProps } from 'api/core/domain/entity/EntityTranslation';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { PropertyAssignment } from 'api/core/domain/template/PropertyValue';
import { TemplateDBO } from '../template/DBOs/TemplateDBO';
import { LoggerFactory } from '../../factories/LoggerFactory';
import { MongoTemplateMapper } from '../template/MongoTemplateMapper';

class MongoEntityLanguageMapper {
  static toDomain(dbo: EntityDBO, template: Template): EntityTranslationProps {
    const commonProperties: Record<string, PropertyAssignment> = {
      title: template.createPropertyAssignment('title', { value: [{ value: dbo.title }] }),
      creationDate: template.createPropertyAssignment('creationDate', {
        value: [{ value: dbo.creationDate }],
      }),
      editDate: template.createPropertyAssignment('editDate', { value: [{ value: dbo.editDate }] }),
    };

    return {
      id: dbo._id.toHexString(),
      language: dbo.language as LanguageISO6391,
      metadata: Object.entries(dbo.metadata).reduce((acc, [name, value]) => {
        const property = template.getPropertyByName(name);
        if (property.isError()) {
          LoggerFactory.systemLogger().info(
            // eslint-disable-next-line max-len
            `Property "${name}" not found in Template "${template.id}" while mapping Entity ${dbo.sharedId} on the language "${dbo.language}". Skipping it.`
          );
          return acc;
        }

        return {
          ...acc,
          [name]: { value, name, type: property.getData().type, language: dbo.language },
        };
      }, commonProperties),
    };
  }
}

class MongoEntityMapper {
  static toDBO(entity: Entity): EntityDBO[] {
    return entity.translationsList.map(([language, translation]) => ({
      _id: ObjectId.createFromHexString(translation.id),
      language,
      sharedId: entity.sharedId,
      template: ObjectId.createFromHexString(entity.template.id),

      user: entity.userId ? ObjectId.createFromHexString(entity.userId) : undefined,

      title: translation.title.value[0].value,
      creationDate: translation.creationDate.value[0].value,
      editDate: translation.editDate.value[0].value,

      icon: entity.icon
        ? {
            _id: entity.icon.id,
            label: entity.icon.label,
            type: entity.icon.type,
          }
        : undefined,
      published: entity.published,
      metadata: Object.entries(translation.properties).reduce(
        (acc, [key, propertyValue]) => ({ ...acc, [key]: propertyValue.value }),
        {}
      ),

      obsoleteMetadata: [], // Todo: handle obsolete metadata
    }));
  }

  static toDomain(entityDbo: EntityDBO[], templateDbo: TemplateDBO): Entity {
    const template = MongoTemplateMapper.toDomain(templateDbo);

    return new Entity({
      template,
      sharedId: entityDbo[0].sharedId,
      published: entityDbo[0].published,
      icon: entityDbo[0].icon && {
        id: entityDbo[0].icon._id,
        label: entityDbo[0].icon.label,
        type: entityDbo[0].icon.type,
      },
      userId: entityDbo[0].user?.toHexString(),
      translations: entityDbo.map(dbo => MongoEntityLanguageMapper.toDomain(dbo, template)),
    });
  }
}

export { MongoEntityMapper };
