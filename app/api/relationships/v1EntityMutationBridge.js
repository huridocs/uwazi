import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { DefaultDispatcher } from '#api/core/libs/queue/configuration/factories.js';
import { EventEmitterFactory } from '#api/core/libs/eventEmitter/EventEmitterFactory.js';
import { User } from '#api/users.v2/model/User.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { PostgresTransactionManagerFactory } from '#api/core/infrastructure/factories/PostgresTransactionManagerFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { tenants } from '#api/tenants/tenantContext.js';
import {
  normalizeAttachments,
  normalizeDocuments,
  sanitizeForTemplate,
} from '#api/entities/legacyMutationCommon.js';

const toUpdateEntityInput = (entity, template, language) => {
  const files = [
    ...normalizeDocuments(entity.documents).map(doc => ({
      id: doc._id,
      originalname: doc.originalname,
    })),
    ...normalizeAttachments(entity.attachments).map(attachment => ({
      id: attachment._id,
      originalname: attachment.originalname,
    })),
  ];

  const propertyAssignments = [
    {
      name: 'title',
      value: [{ value: entity.title }],
    },
    ...Object.entries(entity.metadata || {}).map(([name, value]) => ({
      name,
      value,
    })),
  ];

  return {
    sharedId: entity.sharedId,
    language: entity.language || language,
    propertyAssignments,
    files,
    templateId: template._id?.toString() || entity.template?.toString?.() || entity.template,
  };
};

const resolveEntityActorForFacade = entity => {
  const actorId = entity?.user?.toString?.() || entity?.user;
  return User.createFrom({
    _id: actorId || `relationships-sync:${entity?.sharedId || 'unknown'}`,
    role: 'admin',
    groups: [],
  });
};

const runWithV2Context = async (actor, callback) => {
  if (ExecutionContext.getStore()) {
    await callback();
    return;
  }

  const tenant = tenants.current();
  await ExecutionContext.run(
    {
      tenant,
      actor,
      factories: {
        transactionManager: TransactionManagerFactory.default,
        postgresTransactionManager: PostgresTransactionManagerFactory.default,
        jobsDispatcher: () => DefaultDispatcher(tenant.name, ExecutionContext.transactionManager),
        eventEmitter: EventEmitterFactory.default,
        idGenerator: IdGeneratorFactory.default,
        logger: LoggerFactory.default,
      },
    },
    callback
  );
};

const reentrantTransactionManager = base => {
  const manager = {
    run: async callback => (base.isRunning() ? callback() : base.run(callback)),
    onCommitted: handler => {
      base.onCommitted(handler);
      return manager;
    },
    onRetry: handler => {
      base.onRetry(handler);
      return manager;
    },
    runHandlingOnCommitted: callback => base.runHandlingOnCommitted(callback),
    isRunning: () => base.isRunning(),
  };
  return manager;
};

export {
  normalizeAttachments,
  normalizeDocuments,
  reentrantTransactionManager,
  resolveEntityActorForFacade,
  runWithV2Context,
  sanitizeForTemplate,
  toUpdateEntityInput,
};
