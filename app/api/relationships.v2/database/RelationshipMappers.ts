import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator';
import { ObjectId } from 'mongodb';
import { EntityData, GraphQueryResult, RelationshipData } from '../model/GraphQueryResult';
import { RelationshipDBOType } from './schemas/relationshipTypes';
import {
  EntityPointer,
  Relationship,
  Selection,
  TextReferencePointer,
} from '../model/Relationship';
import { JoinedRelationshipDBOType } from './schemas/relationshipAggregationTypes';

type EntityTraversal = {
  _id: ObjectId;
  sharedId: string;
  title: string;
  traversal?: RelationshpTraversal;
};

type RelationshpTraversal = {
  _id: ObjectId;
  type: string;
  traversal?: EntityTraversal;
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

  toGraphQueryResult(traversalResult: EntityTraversal) {
    const entities: EntityData[] = [];
    const relationships: RelationshipData[] = [];

    const visitors = {
      entity: ({ _id, traversal, ...entityData }: EntityTraversal) => {
        entities.push({ _id: MongoIdHandler.mapToApp(_id), ...entityData });
        if (traversal) visitors.relationship(traversal);
      },
      relationship: ({ _id, traversal, ...relationshipData }: RelationshpTraversal) => {
        relationships.push({ _id: MongoIdHandler.mapToApp(_id), ...relationshipData });
        if (traversal) visitors.entity(traversal);
      },
    };

    visitors.entity(traversalResult);
    return new GraphQueryResult(relationships, entities);
  },
};

export type TraversalResult = EntityTraversal;
