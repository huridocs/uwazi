import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator';
import { MongoResultSet } from 'api/common.v2/database/MongoResultSet';
import { TemplatesDataSource } from '../contracts/TemplatesDataSource';
import { RelationshipProperty } from '../model/RelationshipProperty';
import { mapPropertyQuery } from './QueryMapper';

export class MongoTemplatesDataSource extends MongoDataSource implements TemplatesDataSource {
  protected collectionName = 'templates';

  getAllRelationshipProperties() {
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
      { session: this.getSession() }
    );

    return new MongoResultSet(
      cursor,
      elem =>
        new RelationshipProperty(
          elem.properties.name,
          elem.properties.label,
          mapPropertyQuery(elem.properties.query),
          MongoIdHandler.mapToApp(elem._id)
        )
    );
  }
}
