import { ObjectId } from 'mongodb';
import { GraphQueryResult } from '../model/GraphQueryResult';
import {
  EntityPointer,
  Relationship,
  Selection,
  TextReferencePointer,
} from '../model/Relationship';
import { JoinedRelationshipDBOType } from './schemas/relationshipAggregationTypes';
import { RelationshipDBOType } from './schemas/relationshipTypes';

type TraversalResult = {
  traversal?: TraversalResult;
};

function unrollTraversal({ traversal, ...rest }: TraversalResult): unknown[] {
  return [{ ...rest }].concat(traversal ? unrollTraversal(traversal) : []);
}

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
      _id: new ObjectId(relationship._id),
      from: mapPointerToDBO(relationship.from),
      to: mapPointerToDBO(relationship.to),
      type: new ObjectId(relationship.type),
    };
  },

  toModel(relationship: RelationshipDBOType) {
    return new Relationship(
      relationship._id.toHexString(),
      mapPointerToModel(relationship.from),
      mapPointerToModel(relationship.to),
      relationship.type.toHexString()
    );
  },

  toAggregatedResult(joined: JoinedRelationshipDBOType) {
    return {
      _id: joined._id.toHexString(),
      from: {
        sharedId: joined.from[0]?.sharedId,
        title: joined.from[0]?.title,
      },
      to: {
        sharedId: joined.to[0]?.sharedId,
        title: joined.to[0]?.title,
      },
      type: joined.type.toHexString(),
    };
  },

  toGraphQueryResult(traversal: TraversalResult) {
    return new GraphQueryResult(unrollTraversal(traversal));
  },
};
