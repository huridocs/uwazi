import { AuthorizationService } from 'api/authorization.v2/services/AuthorizationService';
import { IdGenerator } from 'api/common.v2/contracts/IdGenerator';
import { TransactionManager } from 'api/common.v2/contracts/TransactionManager';
import { EntitiesDataSource } from 'api/entities.v2/contracts/EntitiesDataSource';
import { MissingEntityError } from 'api/entities.v2/errors/entityErrors';
import { RelationshipTypesDataSource } from 'api/relationshiptypes.v2/contracts/RelationshipTypesDataSource';
import { MissingRelationshipTypeError } from 'api/relationshiptypes.v2/errors/relationshipTypeErrors';
import { RelationshipsDataSource } from '../contracts/RelationshipsDataSource';
import { Relationship } from '../model/Relationship';
import { DenormalizationService } from './DenormalizationService';

interface CreateRelationshipData {
  from: string;
  to: string;
  type: string;
}
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

  private processInput(relationships: CreateRelationshipData[]) {
    const models: Relationship[] = [];
    const types = new Set<string>();
    const sharedIds = new Set<string>();

    relationships.forEach(relationship => {
      models.push(
        Relationship.create(
          this.idGenerator.generate(),
          relationship.from,
          relationship.to,
          relationship.type
        )
      );
      types.add(relationship.type);
      sharedIds.add(relationship.from).add(relationship.to);
    });

    return {
      models,
      usedTypes: Array.from(types),
      relatedEntities: Array.from(sharedIds),
    };
  }

  async create(relationships: CreateRelationshipData[]) {
    const { models, usedTypes, relatedEntities } = this.processInput(relationships);

    await this.authService.validateAccess('write', relatedEntities);

    if (!(await this.relationshipTypesDS.typesExist(usedTypes))) {
      throw new MissingRelationshipTypeError('Must provide id for existing relationship type');
    }
    if (!(await this.entitiesDS.entitiesExist(relatedEntities))) {
      throw new MissingEntityError('Must provide sharedIds from existing entities');
    }

    const created = await this.transactionManager.run(async () => {
      const insertedRelationships = await this.relationshipsDS.insert(models);

      await this.denormalizationService.denormalizeForNewRelationships(
        insertedRelationships.map(relationship => relationship._id)
      );

      return insertedRelationships;
    });

    return created;
  }
}
