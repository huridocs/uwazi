import { Transactional } from 'api/common.v2/contracts/Transactional';
import { TransactionManager } from 'api/common.v2/contracts/TransactionManager';
import { EntitiesDataSource } from 'api/entities.v2/contracts/EntitiesDataSource';
import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource';
import { RelationshipsDataSource } from '../contracts/RelationshipsDataSource';
import { MatchQueryNode } from '../model/MatchQueryNode';
import { Relationship } from '../model/Relationship';

export class DenormalizationService implements Transactional {
  private relationshipsDS: RelationshipsDataSource;

  private entitiesDS: EntitiesDataSource;

  private templatesDS: TemplatesDataSource;

  private transactionManager: TransactionManager;

  private transactionContext?: unknown;

  constructor(
    relationshipsDS: RelationshipsDataSource,
    entitiesDS: EntitiesDataSource,
    templatesDS: TemplatesDataSource,
    transactionManager: TransactionManager
  ) {
    this.relationshipsDS = relationshipsDS;
    this.entitiesDS = entitiesDS;
    this.templatesDS = templatesDS;
    this.transactionManager = transactionManager;
  }

  setTransactionContext(context: unknown): void {
    this.transactionContext = context;
  }

  clearTransactionContext(): void {
    this.transactionContext = undefined;
  }

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
      properties.map(async ({ property, template }) => {
        const rootedQuery = new MatchQueryNode({ templates: [template] }, property.query);
        const chains = rootedQuery.chainsDecomposition();
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
            leafEntities.forEach(entity =>
              entities.push({
                ...entity,
                propertiesToBeMarked: [property.name],
              })
            );
          })
        );
      })
    );
    return entities;
  }

  async denormalizeBasedOnRelationship(_id: string) {
    await this.transactionManager.run(
      async () => {
        const candidates = await this.getCandidateEntitiesForRelationship(_id);
        // TODO: reindex entities
        await this.entitiesDS.markMetadataAsChanged(candidates);
      },
      [this.relationshipsDS, this.entitiesDS, this.templatesDS],
      this.transactionContext
    );
  }
}
