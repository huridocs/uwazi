/* eslint-disable max-classes-per-file */
import { EntityDBO } from 'api/entities.v2/database/schemas/EntityTypes';
import { Entity } from 'api/core/domain/entity/Entity';
import { ObjectId } from 'mongodb';
import { Template } from 'api/core/domain/template/Template';
import { EntityTranslationProps } from 'api/core/domain/entity/EntityTranslation';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { TemplateDBO } from '../template/DBOs/TemplateDBO';
import { MongoTemplateMapper } from '../template/Mapper';

class MongoEntityLanguageMapper {
  static toDomain(dbo: EntityDBO, template: Template): EntityTranslationProps {
    const commonProperties = {
      title: template.createPropertyAssignment('title', [{ value: dbo.title }]),
      creationDate: template.createPropertyAssignment('creationDate', [
        { value: dbo.creationDate },
      ]),
      editDate: template.createPropertyAssignment('editDate', [{ value: dbo.editDate }]),
    };

    return {
      id: dbo._id.toHexString(),
      language: dbo.language as LanguageISO6391,
      metadata: Object.entries(dbo.metadata).reduce(
        (acc, [name, value]) => ({
          ...acc,
          [name]: template.createPropertyAssignment(name, value),
        }),
        commonProperties
      ),
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
      creationDate: translation.editDate.value[0].value,
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
