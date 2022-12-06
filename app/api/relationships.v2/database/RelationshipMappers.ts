import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator';
import { ObjectId } from 'mongodb';
import { EntityMappers } from 'api/entities.v2/database/EntityMapper';
import { Entity } from 'api/entities.v2/model/Entity';
import { EntityDBO } from 'api/entities.v2/database/schemas/EntityTypes';
import { RelationshipDBOType } from './schemas/relationshipTypes';
import {
  EntityPointer,
  Relationship,
  Selection,
  TextReferencePointer,
} from '../model/Relationship';
import { JoinedRelationshipDBOType } from './schemas/relationshipAggregationTypes';

type EntityTraversal =
  | {
      _id: ObjectId;
      sharedId: string;
      title: string;
      traversal: RelationshipTraversal;
    }
  | (EntityDBO & { traversal: undefined });

type RelationshipTraversal = {
  _id: ObjectId;
  type: string;
  traversal: EntityTraversal;
};

function mapSelectionsToDBO(selections: TextReferencePointer['selections']) {
  return selections.map(selection => ({
    page: selection.page,
    top: selection.top,
    left: selection.left,
    height: selection.height,
    width: selection.width,
  }));
}

function mapPointerToDBO(pointer: Relationship['from' | 'to']) {
  if (pointer instanceof TextReferencePointer) {
    return {
      entity: pointer.entity,
      file: new ObjectId(pointer.file),
      text: pointer.text,
      selections: mapSelectionsToDBO(pointer.selections),
    };
  }

  return { entity: pointer.entity };
}

function mapPointerToModel(pointer: RelationshipDBOType['from' | 'to']) {
  if ('text' in pointer) {
    return new TextReferencePointer(
      pointer.entity,
      pointer.file.toHexString(),
      pointer.selections.map(
        selection =>
          new Selection(
            selection.page,
            selection.top,
            selection.left,
            selection.height,
            selection.width
          )
      ),
      pointer.text
    );
  }

  return new EntityPointer(pointer.entity);
}

export const RelationshipMappers = {
  toDBO(relationship: Relationship): RelationshipDBOType {
    return {
      _id: MongoIdHandler.mapToDb(relationship._id),
      from: mapPointerToDBO(relationship.from),
      to: mapPointerToDBO(relationship.to),
      type: MongoIdHandler.mapToDb(relationship.type),
    };
  },

  toModel(relationship: RelationshipDBOType) {
    return new Relationship(
      MongoIdHandler.mapToApp(relationship._id),
      mapPointerToModel(relationship.from),
      mapPointerToModel(relationship.to),
      MongoIdHandler.mapToApp(relationship.type)
    );
  },

  toAggregatedResult(joined: JoinedRelationshipDBOType) {
    return {
      _id: MongoIdHandler.mapToApp(joined._id),
      from: {
        sharedId: joined.from[0]?.sharedId,
        title: joined.from[0]?.title,
      },
      to: {
        sharedId: joined.to[0]?.sharedId,
        title: joined.to[0]?.title,
      },
      type: MongoIdHandler.mapToApp(joined.type),
    };
  },

  toGraphQueryResult(entityTraversal: EntityTraversal): Entity {
    if (entityTraversal.traversal) {
      return RelationshipMappers.toGraphQueryResult(entityTraversal.traversal.traversal);
    }

    const { traversal, ...entityData } = entityTraversal;
    return EntityMappers.toModel(entityData);
  },
};

export type TraversalResult = EntityTraversal;
