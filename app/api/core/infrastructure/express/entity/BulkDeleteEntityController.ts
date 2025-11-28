import { AbstractController } from 'api/common.v2/infrastructure/AbstractController';
import {
  RequestBulkDeleteEntityInput,
  RequestBulkDeleteEntityUseCase,
} from 'api/core/application/RequestBulkDeleteEntity';
import { search } from 'api/search';
import { DefaultDispatcher } from 'api/core/libs/queue/configuration/factories';
import { tenants } from 'api/tenants';
import entities from 'api/entities';
import { TransactionManagerFactory } from '../../factories/TransactionManagerFactory';
import { MongoEntityPermissionChecker } from '../../mongodb/entity/MongoEntityPermissionChecker';
import { getConnection } from '../../mongodb/common/getConnectionForCurrentTenant';

type RequestDto = RequestBulkDeleteEntityInput;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type ResponseDto = string;

class BulkDeleteEntityController extends AbstractController<RequestDto> {
  protected async handle(): Promise<void> {
    if (tenants.current()?.featureFlags?.v2BulkDeleteEntity) {
      const transactionManager = TransactionManagerFactory.default();
      const jobsDispatcher = DefaultDispatcher(this.tenantName);
      const entityPermissionChecker = new MongoEntityPermissionChecker(
        getConnection(),
        transactionManager
      );

      const useCase = new RequestBulkDeleteEntityUseCase({
        entityPermissionChecker,
        search,
        jobsDispatcher,
        transactionManager,
      });

      await useCase.execute(this.request.body);

      this.response.json('ok');
      return;
    }

    await entities.deleteMultiple(
      RequestBulkDeleteEntityUseCase.InputSchema.parse(this.request.body).sharedIds
    );

    this.response.json('ok');
  }
}

export { BulkDeleteEntityController };
