import { Relationship } from '../model/Relationship';
import {
  validateRelationshipDBO,
  validateJoinedRelationshipDBO,
} from './typing/relationshipSchemas';
import {
  RelationshipDBOType,
  JoinedRelationshipDBOType,
  EntityInfoType,
} from './typing/relationshipTypes';
import { CountDocument, MongoResultSet } from './MongoResultSet';
import { MongoDataSource } from './MongoDataSource';
import { RelationshipMappers } from './RelationshipMappers';
import { RelationshipsQuery } from '../services/RelationshipsQuery';
import { MongoGraphQueryParser } from './MongoGraphQueryParser';

function unrollTraversal({ traversal, ...rest }: any): any {
  return [{ ...rest }].concat(traversal ? unrollTraversal(traversal) : []);
}

type RelationshipAggregatedResultType = Omit<RelationshipDBOType, 'from' | 'to'> & {
  from: EntityInfoType;
  to: EntityInfoType;
};

export class RelationshipsDataSource extends MongoDataSource {
  private getCollection() {
    return this.db.collection<RelationshipDBOType>('relationships');
  }

  async insert(relationship: Relationship): Promise<Relationship> {
    const item = RelationshipMappers.toDBO(relationship);
    validateRelationshipDBO(item);
    const {
      ops: [created],
    } = (await this.getCollection().insertOne(item, {
      session: this.session,
    })) as { ops: RelationshipDBOType[] };
    validateRelationshipDBO(created);

    return RelationshipMappers.toModel(created);
  }

  getByEntity(sharedId: string) {
    const matchStage = {
      $match: {
        $or: [{ from: sharedId }, { to: sharedId }],
      },
    };
    const totalCursor = this.getCollection().aggregate<CountDocument>([
      matchStage,
      {
        $count: 'total',
      },
    ]);

    const dataCursor = this.getCollection().aggregate<JoinedRelationshipDBOType>([
      matchStage,
      {
        $lookup: {
          from: 'entities',
          localField: 'from',
          foreignField: 'sharedId',
          as: 'from',
        },
      },
      {
        $lookup: {
          from: 'entities',
          localField: 'to',
          foreignField: 'sharedId',
          as: 'to',
        },
      },
    ]);

    return new MongoResultSet<JoinedRelationshipDBOType, RelationshipAggregatedResultType>(
      dataCursor,
      validateJoinedRelationshipDBO,
      totalCursor,
      RelationshipMappers.toAggregatedResult
    );
  }

  getByQuery(query: RelationshipsQuery) {
    const parser = new MongoGraphQueryParser();
    const pipeline = parser.parse(query);
    const cursor = this.db.collection('entities').aggregate(pipeline, { session: this.session });
    const count = this.db.collection('entities').aggregate(
      [
        ...pipeline,
        {
          $count: 'total',
        },
      ],
      { session: this.session }
    );
    return new MongoResultSet(cursor, MongoResultSet.NoOpValidator, count, elem =>
      unrollTraversal(elem)
    );
  }
}
