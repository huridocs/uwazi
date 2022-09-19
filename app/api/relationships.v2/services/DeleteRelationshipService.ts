import { AuthorizationService } from 'api/authorization.v2/services/AuthorizationService';
import { TransactionManager } from 'api/common.v2/contracts/TransactionManager';
import { RelationshipsDataSource } from '../database/RelationshipsDataSource';

export class DeleteRelationshipService {
  private relationshipsDS: RelationshipsDataSource;

  private transactionManager: TransactionManager;

  private authService: AuthorizationService;

  // eslint-disable-next-line max-params
  constructor(
    relationshipsDS: RelationshipsDataSource,
    transactionManager: TransactionManager,
    authService: AuthorizationService
  ) {
    this.relationshipsDS = relationshipsDS;
    this.transactionManager = transactionManager;
    this.authService = authService;
  }

  async delete(_id: string) {
    return this.deleteMultiple([_id]).then(deleted => deleted[0]);
  }

  async deleteMultiple(_ids: string[]) {


    // await this.authService.validateAccess('write', sharedIds);

    // return this.transactionManager.run(
    //   async () => {
    //     if (!(await this.relationshipTypesDS.typesExist(types))) {
    //       throw new Error('Must provide id for existing relationship type');
    //     }
    //     if (!(await this.entitiesDS.entitiesExist(sharedIds))) {
    //       throw new Error('Must provide sharedIds from existing entities');
    //     }

    //     return this.relationshipsDS.insert(
    //       relationships.map(r => new Relationship(this.generateId(), r.from, r.to, r.type))
    //     );
    //   },
    //   this.entitiesDS,
    //   this.relationshipsDS,
    //   this.relationshipTypesDS
    // );
  }
}
