import { ResultSet } from 'api/common.v2/contracts/ResultSet';
import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { MongoResultSet } from 'api/common.v2/database/MongoResultSet';
import { MongoGraphQueryParser } from 'api/relationships.v2/database/MongoGraphQueryParser';
import { TemplatesDataSource } from '../contracts/TemplatesDataSource';
import { RelationshipProperty } from '../model/RelationshipProperty';

export class MongoTemplatesDataSource extends MongoDataSource implements TemplatesDataSource {
  protected collectionName = 'templates';

  getAllRelationshipProperties(): ResultSet<RelationshipProperty> {
    const parser = new MongoGraphQueryParser();
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
          $replaceRoot: {
            newRoot: '$properties',
          },
        },
      ],
      { session: this.session }
    );

    return new MongoResultSet(
      cursor,
      elem => new RelationshipProperty(elem.name, elem.label, parser.parse(elem.query))
    );
  }
}
