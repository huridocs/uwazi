import { Relationship } from '../model/Relationship';
import { CountDocument, MongoResultSet } from './MongoResultSet';
import { MongoDataSource } from './MongoDataSource';
import { JoinedRelationshipDBO, RelationshipDBO } from './RelationshipsTypes';
import { RelationshipMappers } from './RelationshipMappers';

interface RelationshipAggregatedResult {
  _id: string;
  from: {
    sharedId: string;
    title: string;
  };
  to: {
    sharedId: string;
    title: string;
  };
  type: string;
}

export class RelationshipsDataSource extends MongoDataSource {
  private getCollection() {
    return this.db.collection<RelationshipDBO>('relationships');
  }

  async insert(relationship: Relationship): Promise<Relationship> {
    const {
      ops: [created],
    } = (await this.getCollection().insertOne(RelationshipMappers.toDBO(relationship), {
      session: this.session,
    })) as { ops: RelationshipDBO[] };

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

    const dataCursor = this.getCollection().aggregate<JoinedRelationshipDBO>([
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

    return new MongoResultSet<JoinedRelationshipDBO, RelationshipAggregatedResult>(
      dataCursor,
      totalCursor,
      RelationshipMappers.toAggegatedResult
    );
  }
}
