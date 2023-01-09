import { AuthorizationService } from 'api/authorization.v2/services/AuthorizationService';
import { TransactionManager } from 'api/common.v2/contracts/TransactionManager';
import { RelationshipsDataSource } from '../contracts/RelationshipsDataSource';
import { MissingRelationshipError } from '../errors/relationshipErrors';
import { DenormalizationService } from './DenormalizationService';

export class DeleteRelationshipService {
  private relationshipsDS: RelationshipsDataSource;

  private transactionManager: TransactionManager;

  private authService: AuthorizationService;

  private denormalizationService: DenormalizationService;

  // eslint-disable-next-line max-params
  constructor(
    relationshipsDS: RelationshipsDataSource,
    transactionManager: TransactionManager,
    authService: AuthorizationService,
    denormalizationService: DenormalizationService
  ) {
    this.relationshipsDS = relationshipsDS;
    this.transactionManager = transactionManager;
    this.authService = authService;
    this.denormalizationService = denormalizationService;
  }

  async delete(_ids: string | string[]) {
    const ids = Array.isArray(_ids) ? _ids : [_ids];
    const toBeDeleted = await this.relationshipsDS.getById(ids).all();

    const sharedIds = toBeDeleted.map(r => [r.from.entity, r.to.entity]).flat();
    await this.authService.validateAccess('write', sharedIds);

    if (!(await this.relationshipsDS.exists(ids))) {
      throw new MissingRelationshipError('Some relationships to be deleted are missing.');
    }

    await this.transactionManager.run(async () => {
      await this.denormalizationService.denormalizeBeforeDeletingRelationships(ids);
      await this.relationshipsDS.delete(ids);
    });
  }
}
