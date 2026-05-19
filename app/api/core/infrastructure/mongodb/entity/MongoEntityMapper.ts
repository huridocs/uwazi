/* eslint-disable max-classes-per-file */
import { ObjectId } from 'mongodb';
import { EntityDBO } from '#api/entities.v2/database/schemas/EntityTypes.js';
import { Entity, EntityIcon } from '#api/core/domain/entity/Entity.js';
import { Template } from '#api/core/domain/template/Template.js';
import { EntityTranslationProps } from '#api/core/domain/entity/EntityTranslation.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { PropertyAssignment } from '#api/core/domain/template/PropertyValue.js';
import { TemplateDBO } from '../template/DBOs/TemplateDBO.js';
import { LoggerFactory } from '../../factories/LoggerFactory.js';
import { MongoTemplateMapper } from '../template/MongoTemplateMapper.js';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const getIconRecord = (entry: unknown) => {
  if (!isRecord(entry)) return null;
  const { icon } = entry;
  if (!isRecord(icon)) return null;
  return icon;
};

const relationshipEntryToDBO = (entry: unknown) => {
  if (!isRecord(entry)) return entry;
  const iconRecord = getIconRecord(entry);
  if (!iconRecord) return entry;

  const iconId = iconRecord.id;
  if (iconId === undefined) return entry;

  const { id, ...restIcon } = iconRecord;

  return {
    ...entry,
    icon: {
      _id: id,
      ...restIcon,
    },
  };
};

const relationshipEntryToDomain = (entry: unknown) => {
  if (!isRecord(entry)) return entry;
  const iconRecord = getIconRecord(entry);
  if (!iconRecord) return entry;

  const iconId = iconRecord._id ?? iconRecord.id;
  if (iconId === undefined) return entry;

  const { _id, id, ...restIcon } = iconRecord;

  return {
    ...entry,
    icon: {
      id: iconId,
      ...restIcon,
    },
  };
};

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

      const mappedValue =
        property.getData().type === 'relationship' && Array.isArray(value)
          ? value.map(entry => relationshipEntryToDomain(entry))
          : value;

      return {
        ...acc,
        [name]: {
          value: mappedValue,
          name,
          type: property.getData().type,
          language: dbo.language,
          isTranslatable: property.getData().isTranslatable,
        } as PropertyAssignment,
      };
    }, commonProperties);

    return {
      id: dbo._id.toHexString(),
      language: dbo.language as LanguageISO6391,
      metadata,
      preview: dbo.preview,
    };
  }
}

class MongoEntityMapper {
  static toDBO(entity: Entity): EntityDBO[] {
    let icon: EntityDBO['icon'] = { _id: null, type: 'Empty' };
    let user: EntityDBO['user'];
    const { sharedId } = entity;
    const template = ObjectId.createFromHexString(entity.template.id);

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
      _id: ObjectId.createFromHexString(translation.id.value),
      language,
      sharedId,
      template,

      user,

      title: translation.title.value[0].value,
      creationDate: translation.creationDate.value[0].value,
      editDate: translation.editDate.value[0].value,

      generatedToc: entity.generatedToc,

      icon,
      preview: translation.preview,
      metadata: Object.entries(translation.properties).reduce((acc, [key, propertyValue]) => {
        if (propertyValue.type === 'relationship') {
          return {
            ...acc,
            [key]: propertyValue.value.map(entry => relationshipEntryToDBO(entry)),
          };
        }

        return { ...acc, [key]: propertyValue.value };
      }, {}),

      obsoleteMetadata: [], // Todo: handle obsolete metadata
      published: undefined as any,
    }));
  }

  static toDomain(entityDbo: EntityDBO[], templateDbo: TemplateDBO): Entity {
    const template = MongoTemplateMapper.toDomain(templateDbo);
    const userId = entityDbo[0].user?.toHexString();
    const { sharedId, generatedToc } = entityDbo[0];

    let icon: EntityIcon | undefined;

    if (entityDbo[0].icon?._id && entityDbo[0]?.icon?.label) {
      icon = {
        id: entityDbo[0].icon._id,
        label: entityDbo[0].icon.label,
        type: entityDbo[0].icon.type,
      };
    }

    return new Entity({
      generatedToc,
      template,
      sharedId,
      icon,
      userId,
      translations: entityDbo.map(dbo => MongoEntityLanguageMapper.toDomain(dbo, template)),
    });
  }
}

export { MongoEntityMapper };
