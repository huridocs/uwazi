import { Relationship } from '../model/Relationship';
import { CountDocument, MongoResultSet } from './MongoResultSet';
import { MongoDataSource } from './MongoDataSource';
import { JoinedRelationshipDBO, RelationshipDBO } from './RelationshipsTypes';
import { RelationshipMappers } from './RelationshipMappers';
import { RelationshipsQuery } from '../services/RelationshipsQuery';
import { buildAggregationPipeline } from './GraphQueryBuilder';
import { DataBlueprint } from '../validation/dataBlueprint';

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

const RelationshipSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    _id: { type: 'object' },
    from: { type: 'string' },
    to: { type: 'string' },
    type: { type: 'object' },
  },
  required: ['_id', 'from', 'to', 'type'],
};
const entityArraySchema = {
  type: 'array',
  items: {
    type: 'object',
    additionalProperties: true,
    properties: {
      sharedId: { type: 'string' },
      title: { type: 'string' },
    },
    required: ['sharedId', 'title'],
  },
};
const relationshipBlueprint = new DataBlueprint(RelationshipSchema);
const JoinedRelationshipDBBlueprint = relationshipBlueprint.substitute({
  from: entityArraySchema,
  to: entityArraySchema,
});

function unrollTraversal({ traversal, ...rest }: any): any {
  return [{ ...rest }].concat(traversal ? unrollTraversal(traversal) : []);
}

export class RelationshipsDataSource extends MongoDataSource {
  private getCollection() {
    return this.db.collection<RelationshipDBO>('relationships');
  }

  async insert(relationship: Relationship): Promise<Relationship> {
    const item = RelationshipMappers.toDBO(relationship);
    relationshipBlueprint.validate(item);
    const {
      ops: [created],
    } = (await this.getCollection().insertOne(item, {
      session: this.session,
    })) as { ops: RelationshipDBO[] };
    relationshipBlueprint.validate(created);

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
      JoinedRelationshipDBBlueprint,
      totalCursor,
      RelationshipMappers.toAggregatedResult
    );
  }

  getByQuery(query: RelationshipsQuery) {
    const pipeline = buildAggregationPipeline(query);
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
    return new MongoResultSet(cursor, count, elem => unrollTraversal(elem));
  }
}
