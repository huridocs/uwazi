import { NextFunction, Request, Response } from 'express';
import { DependenciesContext } from '#api/core/libs/DependenciesContext.js';
import { EventEmitterFactory } from '#api/core/libs/eventEmitter/EventEmitterFactory.js';
import { DefaultDispatcher } from '#api/core/libs/queue/configuration/factories.js';
import { tenants } from '#api/tenants/index.js';
import { IdGeneratorFactory } from '../../factories/IdGeneratorFactory';
import { LoggerFactory } from '../../factories/LoggerFactory';
import { TransactionManagerFactory } from '../../factories/TransactionManagerFactory';
import { ElasticSearchClientFactory } from '../../elasticSearch/ElasticSearchClientFactory';

const dependenciesContextMiddleware = (
  request: Request,
  _response: Response,
  next: NextFunction
) => {
  if (!/^\/api(\/|$)/.test(request.path)) {
    return next();
  }

  const tenant = tenants.current();
  const transactionManager = TransactionManagerFactory.default();
  const jobsDispatcher = DefaultDispatcher(tenant.name, transactionManager);

  const eventEmitter = EventEmitterFactory.default();
  const idGenerator = IdGeneratorFactory.default();
  const logger = LoggerFactory.default();

  const elasticClient = ElasticSearchClientFactory.tenantAware(tenant.name);

  return DependenciesContext.run(
    {
      transactionManager,
      eventEmitter,
      idGenerator,
      jobsDispatcher,
      logger,
      elasticClient,
    },
    next
  );
};

export { dependenciesContextMiddleware };
