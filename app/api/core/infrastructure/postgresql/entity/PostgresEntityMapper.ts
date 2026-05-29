/* eslint-disable max-classes-per-file */
import { Entity, EntityIcon } from '#api/core/domain/entity/Entity.js';
import { Template } from '#api/core/domain/template/Template.js';
import { EntityTranslationProps } from '#api/core/domain/entity/EntityTranslation.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { PropertyAssignment } from '#api/core/domain/template/PropertyValue.js';
import { LoggerFactory } from '../../factories/LoggerFactory.js';
import { MongoRelationshipMetadataMapper } from '../../mongodb/entity/MongoRelationshipMetadataMapper.js';

/**
 * The shape of a row in the PostgreSQL `entities` table.
 * All IDs are TEXT (MongoDB ObjectId hex strings).
 */
export type EntityRow = {
  _id: string;
  sharedId: string;
  language: string;
  templateId: string;
  title: string;
  published: boolean;
  creationDate: number;
  editDate: number;
  userId?: string | null;
  mongoLanguage?: string | null;
  generatedToc?: boolean | null;
  preview?: string | null;
  __v?: number | null;
  icon?: { _id: string | null; label?: string; type: string } | null;
  metadata: Record<string, { value: string | number; label?: string }[]>;
  obsoleteMetadata: string[];
  permissions: { refId: string; type: string; level: string }[];
};

class PostgresEntityLanguageMapper {
  static toDomain(row: EntityRow, template: Template): EntityTranslationProps {
    const commonProperties: Record<string, PropertyAssignment> = {
      title: template.createPropertyAssignment('title', { value: [{ value: row.title }] }),
      creationDate: template.createPropertyAssignment('creationDate', {
        value: [{ value: row.creationDate }],
      }),
      editDate: template.createPropertyAssignment('editDate', {
        value: [{ value: row.editDate }],
      }),
    };

    const metadata = Object.entries(row.metadata).reduce((acc, [name, value]) => {
      const property = template.getPropertyByName(name);
      if (property.isError()) {
        LoggerFactory.systemLogger().info(
          `Property "${name}" not found in Template "${template.id}" while mapping Entity ${row.sharedId} on the language "${row.language}". Skipping it.`
        );
        return acc;
      }

      const mappedValue =
        property.getData().type === 'relationship' && Array.isArray(value)
          ? MongoRelationshipMetadataMapper.toDomain(value)
          : value;

      return {
        ...acc,
        [name]: {
          value: mappedValue,
          name,
          type: property.getData().type,
          language: row.language,
          isTranslatable: property.getData().isTranslatable,
        } as PropertyAssignment,
      };
    }, commonProperties);

    return {
      id: row._id,
      language: row.language as LanguageISO6391,
      metadata,
      preview: row.preview ?? undefined,
    };
  }
}

export class PostgresEntityMapper {
  static toDBO(entity: Entity): EntityRow[] {
    let icon: EntityRow['icon'] = { _id: null, type: 'Empty' };
    const { sharedId } = entity;

    if (entity.icon) {
      icon = {
        _id: entity.icon.id,
        label: entity.icon.label,
        type: entity.icon.type,
      };
    }

    return entity.translationsList.map(([language, translation]) => ({
      _id: translation.id.value,
      language,
      sharedId,
      templateId: entity.template.id,

      userId: entity.userId ?? null,

      title: translation.title.value[0].value,
      creationDate: translation.creationDate.value[0].value,
      editDate: translation.editDate.value[0].value,

      generatedToc: entity.generatedToc ?? null,

      icon,
      preview: translation.preview ?? null,

      metadata: Object.entries(translation.properties).reduce<EntityRow['metadata']>(
        (acc, [key, propertyValue]) => {
          if (propertyValue.type === 'relationship') {
            return {
              ...acc,
              [key]: MongoRelationshipMetadataMapper.toDBO(propertyValue.value),
            };
          }
          return { ...acc, [key]: propertyValue.value as any };
        },
        {}
      ),

      obsoleteMetadata: [],
      published: false,
      permissions: [],
    }));
  }

  static toDomain(rows: EntityRow[], template: Template): Entity {
    const [first] = rows;
    const userId = first.userId ?? undefined;
    const { sharedId, generatedToc } = first;

    let icon: EntityIcon | undefined;
    if (first.icon?._id && first.icon?.label) {
      icon = {
        id: first.icon._id,
        label: first.icon.label,
        type: first.icon.type,
      };
    }

    return new Entity({
      generatedToc: generatedToc ?? undefined,
      template,
      sharedId,
      icon,
      userId,
      translations: rows.map(row => PostgresEntityLanguageMapper.toDomain(row, template)),
    });
  }
}
