import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { CountDocument, MongoResultSet } from 'api/common.v2/database/MongoResultSet';
import { MongoIdGenerator } from 'api/common.v2/database/MongoIdGenerator';
import {
  ApplicationRelationshipType,
  Relationship,
  RelationshipValueQuery,
} from '../model/Relationship';
import { RelationshipMappers } from './RelationshipMappers';
import { RelationshipDBOType, JoinedRelationshipDBOType } from './schemas/relationshipTypes';
import { RelationshipsDataSource } from '../contracts/RelationshipsDataSource';
import { compileQuery } from './MongoGraphQueryCompiler';
import { MatchQueryNode } from '../model/MatchQueryNode';

const idsToDb = (ids: string[]) => ids.map(id => MongoIdGenerator.mapToDb(id));

type TraversalResult = {
  traversal?: TraversalResult;
};

export class MongoRelationshipsDataSource
  extends MongoDataSource<RelationshipDBOType>
  implements RelationshipsDataSource
{ //eslint-disable-line
  protected collectionName = 'relationships';

  async insert(relationships: Relationship[]): Promise<Relationship[]> {
    const items = relationships.map(r => RelationshipMappers.toDBO(r));
    const { ops: created } = (await this.getCollection().insertMany(items, {
      session: this.session,
    })) as { ops: RelationshipDBOType[] };

    return created.map(item => RelationshipMappers.toModel(item));
  }

  private async count(ids: string[]) {
    return this.getCollection().countDocuments(
      { _id: { $in: idsToDb(ids) } },
      { session: this.session }
    );
  }

  async exists(ids: string[]) {
    const existingCount = await this.count(ids);
    return existingCount === ids.length;
  }

  async countBy(propValues: Partial<ApplicationRelationshipType>): Promise<number> {
    const query = RelationshipMappers.partialToDBO(propValues);
    return this.getCollection().find(query).count();
  }

  getBy(values: RelationshipValueQuery) {
    const query = RelationshipMappers.partialToDBO(values);
    const cursor = this.getCollection().find(query);
    return new MongoResultSet<RelationshipDBOType, Relationship>(
      cursor,
      RelationshipMappers.toModel
    );
  }

  getById(_ids: string[]) {
    const ids = idsToDb(_ids);
    const cursor = this.getCollection().find({ _id: { $in: ids } }, { session: this.session });
    return new MongoResultSet<RelationshipDBOType, Relationship>(
      cursor,
      RelationshipMappers.toModel
    );
  }

  async delete(_ids: string[]) {
    const ids = idsToDb(_ids);
    const deleted = await this.getById(_ids).all();
    await this.getCollection().deleteMany({ _id: { $in: ids } }, { session: this.session });
    return deleted;
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

    return new MongoResultSet(dataCursor, totalCursor, RelationshipMappers.toAggregatedResult);
  }

  getByQuery(query: MatchQueryNode, language: string) {
    const pipeline = compileQuery(query, language);
    const cursor = this.db
      .collection('entities')
      .aggregate<TraversalResult>(pipeline, { session: this.session });
    const count = this.db.collection<CountDocument>('entities').aggregate(
      [
        ...pipeline,
        {
          $count: 'total',
        },
      ],
      { session: this.session }
    );
    return new MongoResultSet(cursor, count, RelationshipMappers.toGraphQueryResult);
  }

  async deleteBy(values: Partial<ApplicationRelationshipType>): Promise<Relationship[]> {
    const query = RelationshipMappers.partialToDBO(values);
    const deleted = await this.getBy(values).all();
    await this.getCollection().deleteMany(query, { session: this.session });
    return deleted;
  }
}
