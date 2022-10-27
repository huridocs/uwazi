import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { MongoResultSet } from 'api/common.v2/database/MongoResultSet';
import { MongoIdGenerator } from 'api/common.v2/database/MongoIdGenerator';
import { ApplicationRelationshipType, Relationship } from '../model/Relationship';
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
    await this.getCollection().insertMany(items, {
      session: this.getSession(),
    });

    return relationships;
  }

  private async count(ids: string[]) {
    return this.getCollection().countDocuments(
      { _id: { $in: idsToDb(ids) } },
      { session: this.getSession() }
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

  getById(_ids: string[]) {
    const ids = idsToDb(_ids);
    const cursor = this.getCollection().find({ _id: { $in: ids } }, { session: this.getSession() });
    return new MongoResultSet<RelationshipDBOType, Relationship>(
      cursor,
      RelationshipMappers.toModel
    );
  }

  async delete(_ids: string[]) {
    const ids = idsToDb(_ids);
    await this.getCollection().deleteMany({ _id: { $in: ids } }, { session: this.getSession() });
  }

  getByEntity(sharedId: string) {
    const dataCursor = this.getCollection().aggregate<JoinedRelationshipDBOType>([
      {
        $match: {
          $or: [{ from: sharedId }, { to: sharedId }],
        },
      },
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

    return new MongoResultSet(dataCursor, RelationshipMappers.toAggregatedResult);
  }

  getByQuery(query: MatchQueryNode, language: string) {
    const pipeline = compileQuery(query, language);
    const cursor = this.db
      .collection('entities')
      .aggregate<TraversalResult>(pipeline, { session: this.getSession() });
    return new MongoResultSet(cursor, RelationshipMappers.toGraphQueryResult);
  }

  async deleteBy(values: Partial<ApplicationRelationshipType>) {
    const query = RelationshipMappers.partialToDBO(values);
    await this.getCollection().deleteMany(query, { session: this.getSession() });
  }
}
