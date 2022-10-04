import { ResultSet } from 'api/common.v2/contracts/ResultSet';
import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { MongoResultSet } from 'api/common.v2/database/MongoResultSet';
import { EdgeQuery } from 'api/relationships.v2/contracts/RelationshipsQuery';
import { MongoGraphQueryParser } from 'api/relationships.v2/database/MongoGraphQueryParser';
import { TemplatesDataSource } from '../contracts/TemplatesDataSource';
import { RelationshipProperty } from '../model/RelationshipProperty';

export class MongoTemplatesDataSource extends MongoDataSource implements TemplatesDataSource {
  protected collectionName = 'templates';

  getAllRelationshipProperties(): ResultSet<{ property: RelationshipProperty; template: string }> {
    const cursor = this.getCollection().aggregate(
      [
        {
          $match: {
            'properties.type': 'newRelationship',
          },
        },
        { $unwind: '$properties' },
        {
          $match: {
            'properties.type': 'newRelationship',
          },
        },
        {
          $project: {
            _id: 1,
            properties: 1,
          },
        },
      ],
      { session: this.session }
    );

    return new MongoResultSet(cursor, elem => ({
      property: new RelationshipProperty(
        elem.properties.name,
        elem.properties.label,
        (elem.properties.query || []).map((query: EdgeQuery) =>
          MongoGraphQueryParser.parseTraversal(query)
        )
      ),
      template: elem._id.toHexString(),
    }));
  }
}
