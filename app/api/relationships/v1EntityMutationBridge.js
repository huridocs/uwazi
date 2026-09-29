import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { ExecutionContextFactory } from '#api/core/infrastructure/factories/ExecutionContextFactory.js';
import { User } from '#api/users.v2/model/User.js';
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
  await ExecutionContextFactory.run({ tenant, actor, telemetry: { kind: 'v1_bridge' } }, callback);
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
