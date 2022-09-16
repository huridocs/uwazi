import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { CountDocument, MongoResultSet } from 'api/common.v2/database/MongoResultSet';
import { Relationship } from '../model/Relationship';
import { RelationshipMappers } from './RelationshipMappers';
import { MongoGraphQueryParser } from './MongoGraphQueryParser';
import { RelationshipsQuery } from '../contracts/RelationshipsQuery';
import {
  validateRelationshipDBO,
  validateJoinedRelationshipDBO,
} from './schemas/relationshipSchemas';
import {
  RelationshipDBOType,
  EntityInfoType,
  JoinedRelationshipDBOType,
} from './schemas/relationshipTypes';

function unrollTraversal({ traversal, ...rest }: any): any {
  return [{ ...rest }].concat(traversal ? unrollTraversal(traversal) : []);
}

type RelationshipAggregatedResultType = Omit<
  RelationshipDBOType,
  '_id' | 'type' | 'from' | 'to'
> & {
  _id: string;
  type: string;
  from: EntityInfoType;
  to: EntityInfoType;
};

export class RelationshipsDataSource extends MongoDataSource {
  private getCollection() {
    return this.db.collection<RelationshipDBOType>('relationships');
  }

  async insert(relationships: Relationship[]): Promise<Relationship[]> {
    const items = relationships.map(r => RelationshipMappers.toDBO(r));
    items.forEach(item => validateRelationshipDBO(item));
    const { ops: created } = (await this.getCollection().insertMany(items, {
      session: this.session,
    })) as { ops: RelationshipDBOType[] };
    created.forEach(item => validateRelationshipDBO(item));

    return created.map(item => RelationshipMappers.toModel(item));
  }

  getById(ids: string[]) {
    // const getCursor =  this.getCollection().find({ _id: { $in: ids } });
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
