import { EntitiesDataSource } from 'api/entities.v2/contracts/EntitiesDataSource';
import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource';
import { RelationshipsDataSource } from '../contracts/RelationshipsDataSource';
import { MatchQueryNode } from '../database/graphs/MatchQueryNode';
import { Relationship } from '../model/Relationship';

export class DenormalizationService {
  private relationshipsDS: RelationshipsDataSource;

  private entitiesDS: EntitiesDataSource;

  private templatesDS: TemplatesDataSource;

  constructor(
    relationshipsDS: RelationshipsDataSource,
    entitiesDS: EntitiesDataSource,
    templatesDS: TemplatesDataSource
  ) {
    this.relationshipsDS = relationshipsDS;
    this.entitiesDS = entitiesDS;
    this.templatesDS = templatesDS;
  }

  // DISCUSS: typescript method overloading

  async getCandidateEntitiesForRelationship(id: string): Promise<any[]>;

  async getCandidateEntitiesForRelationship(rel: Relationship): Promise<any[]>;

  async getCandidateEntitiesForRelationship(idOrRel: string | Relationship): Promise<any[]> {
    const relationship =
      idOrRel instanceof Relationship
        ? idOrRel
        : (await this.relationshipsDS.getById([idOrRel]).all())[0];
    const [entity1, entity2] = await this.entitiesDS
      .getByIds([relationship.from, relationship.to])
      .all();
    const properties = await this.templatesDS.getAllRelationshipProperties().all();

    const entities: any[] = [];
    await Promise.all(
      properties.map(async property => {
        // DISCUSS: consider also returning the property, for targeted update instead of the entire entity
        const chains = property.query.chainsDecomposition();
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
