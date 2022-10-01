import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { EntitiesDataSource } from 'api/entities.v2/contracts/EntitiesDataSource';
import { PropertySchema } from 'shared/types/commonTypes';
import { TemplateSchema } from 'shared/types/templateType';
import { RelationshipsDataSource } from '../contracts/RelationshipsDataSource';
import { MatchQueryNode } from '../database/graphs/MatchQueryNode';
import { MongoGraphQueryParser } from '../database/MongoGraphQueryParser';
import { Relationship } from '../model/Relationship';

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

  // DISCUSS: typescript method overloading

  async getCandidateEntitiesForRelationship(id: string): Promise<any[]>;

  async getCandidateEntitiesForRelationship(rel: Relationship): Promise<any[]>;

  async getCandidateEntitiesForRelationship(idOrRel: string | Relationship): Promise<any[]> {
    const parser = new MongoGraphQueryParser();
    const relationship =
      idOrRel instanceof Relationship
        ? idOrRel
        : (await this.relationshipsDS.getById([idOrRel]).all())[0];
    const [entity1, entity2] = await this.entitiesDS
      .getByIds([relationship.from, relationship.to])
      .all();
    const properties = await getNewRelProps();

    const entities: any[] = [];
    await Promise.all(
      properties.map(async property => {
        // DISCUSS: consider also returning the property, for targeted update instead of the entire entity
        const { query } = property;
        const ast = parser.parseRoot(query);

        const chains = ast.chainsDecomposition();
        const reachingPathes = chains.map(chain =>
          chain.reachesRelationship(relationship, {
            [entity1.sharedId]: entity1,
            [entity2.sharedId]: entity2,
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
