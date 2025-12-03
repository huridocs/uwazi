import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { CreateThesaurusUseCase } from 'api/core/application/CreateThesaurus';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant';
import { MongoThesauriDataSourceV2 } from '../mongodb/thesauri/MongoThesaurusDataSourceV2';

class CreateThesaurusUseCaseFactory {
  static default() {
    const transactionManager = TransactionManagerFactory.default();
    const thesauriDS = new MongoThesauriDataSourceV2(getConnection(), transactionManager);

    const useCase = new CreateThesaurusUseCase({
      transactionManager,
      thesauriDS,
    });

    return useCase;
  }
}
export { CreateThesaurusUseCaseFactory };
