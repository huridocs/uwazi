import { NextFunction, Request, Response } from 'express';
import { tenants } from '#api/tenants/index.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { TransactionManagerFactory } from '../../factories/TransactionManagerFactory.js';
import { DefaultDispatcher } from '#api/core/libs/queue/configuration/factories.js';
import { EventEmitterFactory } from '#api/core/libs/eventEmitter/EventEmitterFactory.js';
import { IdGeneratorFactory } from '../../factories/IdGeneratorFactory.js';
import { LoggerFactory } from '../../factories/LoggerFactory.js';
import { ElasticSearchClientFactory } from '../../elasticSearch/ElasticSearchClientFactory.js';
import { User } from '#api/users.v2/model/User.js';

const dependenciesContextMiddleware = (
  request: Request,
  _response: Response,
  next: NextFunction
) => {
  if (!/^\/api(\/|$)/.test(request.path)) {
    return next();
  }

  const tenant = tenants.current();
  const actor = User.createFrom(request.user);

  return ExecutionContext.run(
    {
      tenant,
      actor,
      factories: {
        transactionManager: TransactionManagerFactory.default,
        jobsDispatcher: () => DefaultDispatcher(tenant.name, ExecutionContext.transactionManager),
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
