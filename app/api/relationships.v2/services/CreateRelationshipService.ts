import { AuthorizationService } from 'api/authorization.v2/services/AuthorizationService';
import { IdGenerator } from 'api/common.v2/contracts/IdGenerator';
import { TransactionManager } from 'api/common.v2/contracts/TransactionManager';
import { EntitiesDataSource } from 'api/entities.v2/contracts/EntitiesDataSource';
import { MissingEntityError } from 'api/entities.v2/errors/entityErrors';
import { RelationshipTypesDataSource } from 'api/relationshiptypes.v2/contracts/RelationshipTypesDataSource';
import { MissingRelationshipTypeError } from 'api/relationshiptypes.v2/errors/relationshipTypeErrors';
import { RelationshipsDataSource } from '../contracts/RelationshipsDataSource';
import { SelfReferenceError } from '../errors/relationshipErrors';
import { Relationship } from '../model/Relationship';
import { DenormalizationService } from './DenormalizationService';

export class CreateRelationshipService {
  private relationshipsDS: RelationshipsDataSource;

  private entitiesDS: EntitiesDataSource;

  private transactionManager: TransactionManager;

  private relationshipTypesDS: RelationshipTypesDataSource;

  private idGenerator: IdGenerator;

  private authService: AuthorizationService;

  private denormalizationService: DenormalizationService;

  // eslint-disable-next-line max-params
  constructor(
    relationshipsDS: RelationshipsDataSource,
    relationshipTypesDS: RelationshipTypesDataSource,
    entitiesDS: EntitiesDataSource,
    transactionManager: TransactionManager,
    idGenerator: IdGenerator,
    authService: AuthorizationService,
    denormalizationService: DenormalizationService
  ) {
    this.relationshipsDS = relationshipsDS;
    this.relationshipTypesDS = relationshipTypesDS;
    this.entitiesDS = entitiesDS;
    this.transactionManager = transactionManager;
    this.idGenerator = idGenerator;
    this.authService = authService;
    this.denormalizationService = denormalizationService;
  }

  async createMultiple(relationships: { from: string; to: string; type: string }[]) {
    relationships.forEach(r => {
      if (r.from === r.to) {
        throw new SelfReferenceError('Cannot create relationship to itself');
      }
    });

    const types = relationships.map(r => r.type);
    const sharedIds = Array.from(
      new Set(relationships.map(r => r.from).concat(relationships.map(r => r.to)))
    );

    await this.authService.validateAccess('write', sharedIds);

    const created = await this.transactionManager.run(async () => {
      if (!(await this.relationshipTypesDS.typesExist(types))) {
        throw new MissingRelationshipTypeError('Must provide id for existing relationship type');
      }
      if (!(await this.entitiesDS.entitiesExist(sharedIds))) {
        throw new MissingEntityError('Must provide sharedIds from existing entities');
      }

      const insertedRelationships = await this.relationshipsDS.insert(
        relationships.map(r => new Relationship(this.idGenerator.generate(), r.from, r.to, r.type))
      );

      await this.denormalizationService.denormalizeForNewRelationships(insertedRelationships);

      return insertedRelationships;
    });

    return created;
  }
}
