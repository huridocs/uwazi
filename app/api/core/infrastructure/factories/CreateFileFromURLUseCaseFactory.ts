import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { FilesServiceFactory } from './FilesServiceFactory.js';
import { IdGeneratorFactory } from './IdGeneratorFactory.js';
import { CreateFileFromURL } from '#api/core/application/CreateFileFromURL.js';

class CreateFileFromURLUseCaseFactory {
  static default() {
    const { transactionManager } = ExecutionContext;

    return new CreateFileFromURL(
      {
        transactionManager,
        filesService: FilesServiceFactory.default(),
        idGenerator: IdGeneratorFactory.default(),
      },
      { actor: ExecutionContext.actor, tenant: ExecutionContext.tenant }
    );
  }
}

export { CreateFileFromURLUseCaseFactory };
