import { ObjectId } from 'mongodb';
import { Entity } from '#api/core/domain/entity/Entity.js';
import { EntityDBO } from '#api/core/infrastructure/mongodb/entity/EntityDBO.js';
import { MongoRelationshipMetadataMapper } from '#api/core/infrastructure/mongodb/entity/MongoRelationshipMetadataMapper.js';
import { EntityRow } from './PostgresEntityRow.js';

class PostgresEntityMapper {
  static toDBO(entity: Entity): EntityRow[] {
    let icon: EntityRow['icon'] = { _id: null, type: 'Empty' };
    let user: string | null = null;
    const { sharedId } = entity;
    const template = entity.template.id;

    if (entity.icon) {
      icon = {
        _id: entity.icon.id,
        label: entity.icon.label,
        type: entity.icon.type,
      };
    }

    if (entity.userId) {
      user = entity.userId;
    }

    return entity.translationsList.map(([language, translation]) => ({
      _id: translation.id.value,
      language,
      sharedId,
      template,
      user,
      title: translation.title.value[0].value,
      creationDate: translation.creationDate.value[0].value,
      editDate: translation.editDate.value[0].value,
      generatedToc: entity.generatedToc ?? null,
      icon,
      preview: translation.preview ?? null,
      metadata: Object.entries(translation.properties).reduce((acc, [key, propertyValue]) => {
        if (propertyValue.type === 'relationship') {
          return {
            ...acc,
            [key]: MongoRelationshipMetadataMapper.toDBO(propertyValue.value),
          };
        }
        return { ...acc, [key]: propertyValue.value };
      }, {}),
      published: false,
      permissions: [],
    }));
  }

  static toEntityDBO(row: EntityRow): EntityDBO {
    return {
      _id: new ObjectId(row._id),
      sharedId: row.sharedId,
      language: row.language,
      template: new ObjectId(row.template),
      title: row.title,
      icon: (row.icon ?? undefined) as EntityDBO['icon'],
      metadata: row.metadata as EntityDBO['metadata'],
      obsoleteMetadata: [],
      user: row.user ? new ObjectId(row.user) : undefined,
      published: row.published,
      creationDate: row.creationDate,
      editDate: row.editDate,
      generatedToc: row.generatedToc ?? undefined,
      permissions: row.permissions as EntityDBO['permissions'],
      preview: row.preview ?? undefined,
    };
  }
}

export { PostgresEntityMapper };
