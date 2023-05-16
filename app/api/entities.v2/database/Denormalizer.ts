import { MatchQueryNode } from 'api/relationships.v2/model/MatchQueryNode';
import { mapPropertyQuery } from 'api/templates.v2/database/QueryMapper';
import { MongoTemplatesDataSource } from 'api/templates.v2/database/MongoTemplatesDataSource';
import { MongoRelationshipsDataSource } from 'api/relationships.v2/database/MongoRelationshipsDataSource';
import { GraphQueryResultView } from 'api/relationships.v2/model/GraphQueryResultView';
import { MongoEntitiesDataSource } from './MongoEntitiesDataSource';
import { EntityJoinTemplate } from './schemas/EntityTypes';

export class Denormalizer {
  private entitiesDataSource: MongoEntitiesDataSource;

  private templatesDataSource: MongoTemplatesDataSource;

  private relationshipsDataSource: MongoRelationshipsDataSource;

  constructor(
    entitiesDataSource: MongoEntitiesDataSource,
    templatesDataSource: MongoTemplatesDataSource,
    relatioshipsDataSource: MongoRelationshipsDataSource
  ) {
    this.entitiesDataSource = entitiesDataSource;
    this.templatesDataSource = templatesDataSource;
    this.relationshipsDataSource = relatioshipsDataSource;
  }

  private async defineGraphView(
    property: EntityJoinTemplate['joinedTemplate'][0]['properties'][0]
  ) {
    if (property.denormalizedProperty) {
      const denormalizedProperty = await this.templatesDataSource.getPropertyByName(
        property.denormalizedProperty
      );
      return new GraphQueryResultView(denormalizedProperty);
    }

    return new GraphQueryResultView();
  }

  async execute(entity: EntityJoinTemplate) {
    const mappedMetadata: Record<string, { value: string; label: string }[]> = {};
    const stream = this.entitiesDataSource.createBulkStream();

    await Promise.all(
      // eslint-disable-next-line max-statements
      entity.joinedTemplate[0]?.properties.map(async property => {
        if (
          property.type === 'newRelationship' &&
          (entity.obsoleteMetadata || []).includes(property.name)
        ) {
          const configuredQuery = mapPropertyQuery(property.query);
          const configuredView = await this.defineGraphView(property);
          const results = await this.relationshipsDataSource
            .getByQuery(
              new MatchQueryNode({ sharedId: entity.sharedId }, configuredQuery),
              entity.language
            )
            .all();
          mappedMetadata[property.name] = configuredView.map(results);

          await stream.updateOne(
            { sharedId: entity.sharedId, language: entity.language },
            { $set: { [`metadata.${property.name}`]: mappedMetadata[property.name] } }
          );
          return;
        }

        mappedMetadata[property.name] = entity.metadata[property.name];
      }) || []
    );
    await stream.updateOne(
      { sharedId: entity.sharedId, language: entity.language },
      { $set: { obsoleteMetadata: [] } }
    );
    await stream.flush();

    return mappedMetadata;
  }
}
