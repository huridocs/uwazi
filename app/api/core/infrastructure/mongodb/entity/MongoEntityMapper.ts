/* eslint-disable max-classes-per-file */
import { EntityDBO } from 'api/entities.v2/database/schemas/EntityTypes';
import { Entity, EntityIcon } from 'api/core/domain/entity/Entity';
import { ObjectId } from 'mongodb';
import { Template } from 'api/core/domain/template/Template';
import { EntityTranslationProps } from 'api/core/domain/entity/EntityTranslation';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { PropertyAssignment } from 'api/core/domain/template/PropertyValue';
import { PermissionType } from 'api/core/domain/entity/PermissionType';
import { AccessLevel } from 'api/core/domain/entity/AccessLevel';
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

    const metadata = Object.entries(dbo.metadata).reduce((acc, [name, value]) => {
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
        [name]: {
          value,
          name,
          type: property.getData().type,
          language: dbo.language,
        } as PropertyAssignment,
      };
    }, commonProperties);

    return {
      id: dbo._id.toHexString(),
      language: dbo.language as LanguageISO6391,
      metadata,
    };
  }
}

class MongoEntityMapper {
  static toDBO(entity: Entity): EntityDBO[] {
    let icon: EntityDBO['icon'];
    let user: EntityDBO['user'];
    const { published, sharedId } = entity;
    const template = ObjectId.createFromHexString(entity.template.id);

    const permissions = entity.permissions.accessGrants.map(grant => ({
      refId: grant.refId,
      type: grant.type,
      level: grant.level,
    }));

    if (entity.icon) {
      icon = {
        _id: entity.icon.id,
        label: entity.icon.label,
        type: entity.icon.type,
      };
    }

    if (entity.userId) {
      user = ObjectId.createFromHexString(entity.userId);
    }

    return entity.translationsList.map(([language, translation]) => ({
      _id: translation.id ? ObjectId.createFromHexString(translation.id) : new ObjectId(),
      language,
      sharedId,
      template,

      user,

      title: translation.title.value[0].value,
      creationDate: translation.creationDate.value[0].value,
      editDate: translation.editDate.value[0].value,

      icon,
      published,
      permissions,
      metadata: Object.entries(translation.properties).reduce(
        (acc, [key, propertyValue]) => ({ ...acc, [key]: propertyValue.value }),
        {}
      ),

      obsoleteMetadata: [], // Todo: handle obsolete metadata
    }));
  }

  static toDomain(entityDbo: EntityDBO[], templateDbo: TemplateDBO): Entity {
    const template = MongoTemplateMapper.toDomain(templateDbo);
    const userId = entityDbo[0].user?.toHexString();
    const { sharedId, published } = entityDbo[0];
    const permissions = entityDbo[0].permissions?.map(permission => ({
      refId: permission.refId.toString(),
      type: permission.type as PermissionType,
      level: permission.level as AccessLevel,
    }));

    let icon: EntityIcon | undefined;

    if (entityDbo[0].icon) {
      icon = {
        id: entityDbo[0].icon._id,
        label: entityDbo[0].icon.label,
        type: entityDbo[0].icon.type,
      };
    }

    return new Entity({
      template,
      sharedId,
      published,
      icon,
      userId,
      permissions,
      translations: entityDbo.map(dbo => MongoEntityLanguageMapper.toDomain(dbo, template)),
    });
  }
}

export { MongoEntityMapper };
