import { AuthorizationService } from 'api/authorization.v2/services/AuthorizationService';
import { TransactionManager } from 'api/common.v2/contracts/TransactionManager';
import { RelationshipsDataSource } from '../contracts/RelationshipsDataSource';
import { MissingRelationshipError } from '../errors/relationshipErrors';

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
    const deleted = await this.deleteMultiple([_id]);
    return deleted[0];
  }

  async deleteMultiple(_ids: string[]) {
    const toBeDeleted = await this.relationshipsDS.getById(_ids).all();
    const sharedIds = toBeDeleted.map(r => [r.from, r.to]).flat();
    await this.authService.validateAccess('write', sharedIds);

    return this.transactionManager.run(async () => {
      if (!(await this.relationshipsDS.exists(_ids))) {
        throw new MissingRelationshipError('Some relationships to be deleted are missing.');
      }

      return this.relationshipsDS.delete(_ids);
    }, [this.relationshipsDS]);
  }

  async deleteByEntity(sharedId: string) {
    await this.relationshipsDS.deleteBy({ from: sharedId });
    await this.relationshipsDS.deleteBy({ to: sharedId });
  }

  async deleteByType(reltype: string) {
    await this.relationshipsDS.deleteBy({ type: reltype });
  }
}
