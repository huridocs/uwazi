import { AuthorizationService } from 'api/authorization.v2/services/AuthorizationService';
import { IdGenerator } from 'api/common.v2/contracts/IdGenerator';
import { TransactionManager } from 'api/common.v2/contracts/TransactionManager';
import { EntitiesDataSource } from 'api/entities.v2/database/EntitiesDataSource';
import { RelationshipTypesDataSource } from 'api/relationshiptypes.v2/database/RelationshipTypesDataSource';
import { RelationshipsDataSource } from '../database/RelationshipsDataSource';
import { Relationship } from '../model/Relationship';

export class CreateRelationshipService {
  private relationshipsDS: RelationshipsDataSource;

  private entitiesDS: EntitiesDataSource;

  private transactionManager: TransactionManager;

  private relationshipTypesDS: RelationshipTypesDataSource;

  private generateId: IdGenerator;

  private authService: AuthorizationService;

  // eslint-disable-next-line max-params
  constructor(
    relationshipsDS: RelationshipsDataSource,
    relationshipTypesDS: RelationshipTypesDataSource,
    entitiesDS: EntitiesDataSource,
    transactionManager: TransactionManager,
    generateId: IdGenerator,
    authService: AuthorizationService
  ) {
    this.relationshipsDS = relationshipsDS;
    this.relationshipTypesDS = relationshipTypesDS;
    this.entitiesDS = entitiesDS;
    this.transactionManager = transactionManager;
    this.generateId = generateId;
    this.authService = authService;
  }

  async create(from: string, to: string, type: string) {
    await this.authService.validateAccess('write', [from, to]);

    return this.transactionManager.run(
      async (entitiesDS, relationshipsDS, relationshipTypesDS) => {
        if (from === to) {
          throw new Error('Cannot create relationship to itself');
        }
        if (!(await relationshipTypesDS.typesExist([type]))) {
          throw new Error('Must provide id for existing relationship type');
        }
        if (!(await entitiesDS.entitiesExist([from, to]))) {
          throw new Error('Must provide sharedIds from existing entities');
        }

        return relationshipsDS.insert(new Relationship(this.generateId(), from, to, type));
      },
      this.entitiesDS,
      this.relationshipsDS,
      this.relationshipTypesDS
    );
  }
}
