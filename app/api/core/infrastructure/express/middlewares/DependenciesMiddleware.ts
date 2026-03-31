import { NextFunction, Request, Response } from 'express';
import { tenants } from '#api/tenants/index.js';
import { UserSchema } from '#shared/types/userType.js';
import { DependenciesContext } from '#api/core/libs/DependenciesContext.js';
import { TransactionManagerFactory } from '../../factories/TransactionManagerFactory.js';
import { DefaultDispatcher } from '#api/core/libs/queue/configuration/factories.js';
import { EventEmitterFactory } from '#api/core/libs/eventEmitter/EventEmitterFactory.js';
import { IdGeneratorFactory } from '../../factories/IdGeneratorFactory.js';
import { LoggerFactory } from '../../factories/LoggerFactory.js';
import { ElasticSearchClientFactory } from '../../elasticSearch/ElasticSearchClientFactory.js';

const dependenciesContextMiddleware = (
  request: Request,
  _response: Response,
  next: NextFunction
) => {
  if (!/^\/api(\/|$)/.test(request.path)) {
    return next();
  }

  const tenant = tenants.current();
  const actor = request.user as UserSchema | null;

  return DependenciesContext.run(
    {
      factories: {
        transactionManager: TransactionManagerFactory.default,
        jobsDispatcher: () =>
          DefaultDispatcher(tenant.name, DependenciesContext.transactionManager),
        eventEmitter: EventEmitterFactory.default,
        idGenerator: IdGeneratorFactory.default,
        logger: LoggerFactory.default,
        elasticClient: () => ElasticSearchClientFactory.tenantAware(tenant.name),
        authorizedEntityESClient: () =>
          ElasticSearchClientFactory.authorizedEntityClient(tenant.name, actor),
      },
    },
    next
  );
};

export { dependenciesContextMiddleware };
