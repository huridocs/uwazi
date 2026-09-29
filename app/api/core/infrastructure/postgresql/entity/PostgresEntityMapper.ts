import { ObjectId } from 'mongodb';
import { Entity } from '#api/core/domain/entity/Entity.js';
import { EntityDBO } from '#api/core/infrastructure/mongodb/entity/EntityDBO.js';
import { MongoRelationshipMetadataMapper } from '#api/core/infrastructure/mongodb/entity/MongoRelationshipMetadataMapper.js';
import { EntityRow } from './PostgresEntityRow.js';

/**
 * Identity may not be invented. `new ObjectId(undefined)` mints a fresh id, so a row that lost its
 * `_id` to a projection used to map to an entity that exists nowhere — and that id was written
 * into suggestions which could then never be accepted (F49).
 *
 * Every other column is projectable and simply absent when it was not selected; identity is not,
 * so a row without one is a programming error upstream, and this is where it is cheapest to see.
 */
const requireId = (value: string | undefined | null, table: string) => {
  if (!value) {
    throw new Error(`${table}: cannot map a row with no "_id" — the projection dropped it`);
  }
  return new ObjectId(value);
};

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
    }));
  }

  static toEntityDBO(row: EntityRow): EntityDBO {
    return {
      _id: requireId(row._id, 'entities'),
      sharedId: row.sharedId,
      language: row.language,
      template: (row.template ? new ObjectId(row.template) : undefined) as EntityDBO['template'],
      title: row.title,
      icon: (row.icon ?? undefined) as EntityDBO['icon'],
      metadata: row.metadata as EntityDBO['metadata'],
      obsoleteMetadata: [],
      user: row.user ? new ObjectId(row.user) : undefined,
      published: row.published ?? false,
      creationDate: Number(row.creationDate),
      editDate: Number(row.editDate),
      generatedToc: row.generatedToc ?? undefined,
      permissions: row.permissions as EntityDBO['permissions'],
      preview: row.preview ?? undefined,
    };
  }
}

export { PostgresEntityMapper };
