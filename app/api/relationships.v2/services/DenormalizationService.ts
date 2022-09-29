import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { EntitiesDataSource } from 'api/entities.v2/contracts/EntitiesDataSource';
import { PropertySchema } from 'shared/types/commonTypes';
import { TemplateSchema } from 'shared/types/templateType';
import { RelationshipsDataSource } from '../contracts/RelationshipsDataSource';
import { MatchQueryNode } from '../database/graphs/MatchQueryNode';
import { MongoGraphQueryParser } from '../database/MongoGraphQueryParser';

async function getNewRelProps() {
  const templates = await getConnection()
    .collection<TemplateSchema>('templates')
    .find({})
    .toArray();
  const properties: PropertySchema[] = [];
  templates.forEach(template => {
    template.properties?.forEach(property => {
      if (property.type === 'newRelationship') {
        properties.push(property);
      }
    });
  });
  return properties;
}

export class DenormalizationService {
  private relationshipsDS: RelationshipsDataSource;

  private entitiesDS: EntitiesDataSource;

  constructor(relationshipsDS: RelationshipsDataSource, entitiesDS: EntitiesDataSource) {
    this.relationshipsDS = relationshipsDS;
    this.entitiesDS = entitiesDS;
  }

  async getCandidateEntitiesForRelationship(id: string) {
    const parser = new MongoGraphQueryParser();
    const [relationship] = await this.relationshipsDS.getById([id]).all();
    const [from, to] = await this.entitiesDS.getByIds([relationship.from, relationship.to]).all();
    const properties = await getNewRelProps();

    const entities: any[] = [];
    await Promise.all(
      properties.map(async property => {
        const { query } = property;
        const ast = parser.parseRoot(query);

        const chains = ast.chainsDecomposition();
        const reachingPathes = chains.map(chain =>
          chain.reachesRelationship(relationship, {
            [from.sharedId]: from,
            [to.sharedId]: to,
          })
        );
        const queries: MatchQueryNode[] = [];

        reachingPathes.forEach(path => {
          if (path) {
            const inversePath = path.inverse();
            queries.push(inversePath);
          }
        });

        await Promise.all(
          queries.map(async q => {
            const result = this.relationshipsDS.getByModelQuery(q);
            const leafEntities = (await result.all()).map(path => path[path.length - 1]);
            leafEntities.forEach(entity => entities.push(entity));
          })
        );
      })
    );
    return entities;
  }
}
