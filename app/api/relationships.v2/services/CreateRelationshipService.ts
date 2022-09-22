/* eslint-disable max-statements */
import { AuthorizationService } from 'api/authorization.v2/services/AuthorizationService';
import { IdGenerator } from 'api/common.v2/contracts/IdGenerator';
import { TransactionManager } from 'api/common.v2/contracts/TransactionManager';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { EntitiesDataSource } from 'api/entities.v2/contracts/EntitiesDataSource';
import { MissingEntityError } from 'api/entities.v2/errors/entityErrors';
import { RelationshipTypesDataSource } from 'api/relationshiptypes.v2/contracts/RelationshipTypesDataSource';
import { MissingRelationshipTypeError } from 'api/relationshiptypes.v2/errors/relationshipTypeErrors';
import { propertyTypes } from 'shared/propertyTypes';
import { RelationshipsDataSource } from '../contracts/RelationshipsDataSource';
import { RelationshipsQuery } from '../contracts/RelationshipsQuery';
import { SelfReferenceError } from '../errors/relationshipErrors';
import { Relationship } from '../model/Relationship';

export class CreateRelationshipService {
  private relationshipsDS: RelationshipsDataSource;

  private entitiesDS: EntitiesDataSource;

  private transactionManager: TransactionManager;

  private relationshipTypesDS: RelationshipTypesDataSource;

  private idGenerator: IdGenerator;

  private authService: AuthorizationService;

  // eslint-disable-next-line max-params
  constructor(
    relationshipsDS: RelationshipsDataSource,
    relationshipTypesDS: RelationshipTypesDataSource,
    entitiesDS: EntitiesDataSource,
    transactionManager: TransactionManager,
    idGenerator: IdGenerator,
    authService: AuthorizationService
  ) {
    this.relationshipsDS = relationshipsDS;
    this.relationshipTypesDS = relationshipTypesDS;
    this.entitiesDS = entitiesDS;
    this.transactionManager = transactionManager;
    this.idGenerator = idGenerator;
    this.authService = authService;
  }

  async create(from: string, to: string, type: string) {
    return this.createMultiple([{ from, to, type }]).then(created => created[0]);
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

    return this.transactionManager.run(
      async () => {
        if (!(await this.relationshipTypesDS.typesExist(types))) {
          throw new MissingRelationshipTypeError('Must provide id for existing relationship type');
        }
        if (!(await this.entitiesDS.entitiesExist(sharedIds))) {
          throw new MissingEntityError('Must provide sharedIds from existing entities');
        }

        const insertedRelationships = await this.relationshipsDS.insert(
          relationships.map(
            r => new Relationship(this.idGenerator.generate(), r.from, r.to, r.type)
          )
        );

        await Promise.all(
          insertedRelationships.map(async relationship => {
            const db = getConnection();
            const entities = db.collection('entities');
            const entity = await entities.findOne(
              { sharedId: relationship.from },
              { projection: { template: 1 } }
            );

            const templates = db.collection('templates');
            const { properties } = await templates.findOne(
              { _id: entity.template },
              { projection: { properties: 1 } }
            );

            const relProperties = properties.filter(
              (prop: { type: keyof typeof propertyTypes }) => prop.type === 'newRelationship'
            );

            await Promise.all(
              relProperties.map(async (relProperty: { query: { traverse: any } }) => {
                const denormalizationQuery: RelationshipsQuery = {
                  sharedId: relationship.from,
                  traverse: relProperty.query.traverse,
                };

                const graphResults = this.relationshipsDS.getByQuery(denormalizationQuery);

                const leafEntities = (await graphResults.all()).map(path => path[path.length - 1]);

                await entities.updateOne(
                  { sharedId: relationship.from },
                  {
                    $set: {
                      'metadata.relProp': leafEntities.map(e => ({
                        value: e.sharedId,
                        label: e.sharedId,
                      })),
                    },
                  }
                );
              })
            );
          })
        );

        return insertedRelationships;
      },
      this.entitiesDS,
      this.relationshipsDS,
      this.relationshipTypesDS
    );
  }
}
