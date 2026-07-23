import { storage } from '#api/files/index.js';
import { FilesDAOFactory } from '#api/core/infrastructure/factories/FilesDAOFactory.js';
import { prettifyError } from '#api/utils/handleError.js';
import { legacyLogger } from '#api/log/index.js';
import request from '#shared/JSONRequest.js';
import entities from '#api/entities/index.js';
import { EntityWithFilesSchema } from '#shared/types/entityType.js';
import users from '#api/users/users.js';
import { LanguageISO6391, TocSchema } from '#shared/types/commonTypes.js';
import { FileType } from '#shared/types/fileType.js';
import { tenants } from '#api/tenants/index.js';
import settings from '#api/settings/index.js';
import { permissionsContext } from '#api/permissions/permissionsContext.js';
import { runInJobContext } from '#api/services/tasksmanager/runInJobContext.js';
import { FilesDataSourceFactory } from '#api/core/infrastructure/factories/FilesDataSourceFactory.js';
import { FilesServiceFactory } from '#api/core/infrastructure/factories/FilesServiceFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { EntityFacade } from '#api/core/infrastructure/facades/EntitiesFacade.js';
import type { UpdateEntityRequest } from '#api/core/infrastructure/express/entity/Schemas.js';
import { User } from '#api/users.v2/model/User.js';

const fakeTocEntry = (label: string): TocSchema => ({
  selectionRectangles: [{ top: 0, left: 0, width: 0, height: 0, page: '1' }],
  indentation: 0,
  label,
});

const ensureEntityActor = async (entity: EntityWithFilesSchema) => {
  if (ExecutionContext.actor) {
    return;
  }

  const actorId = entity.user?.toString?.();
  if (!actorId) {
    throw new Error(`Entity actor is missing for sharedId ${entity.sharedId}`);
  }

  const actorInDb = await users.getById(actorId, '-password', false, true);
  if (!actorInDb) {
    throw new Error(`Entity actor not found for user ${actorId}`);
  }

  ExecutionContext.actor = User.createFrom(actorInDb);
};

// eslint-disable-next-line max-statements
const toEntityUpdatePayload = (
  entity: EntityWithFilesSchema,
  generatedToc: boolean
): UpdateEntityRequest | null => {
  const { sharedId, language, title } = entity;
  const template = entity.template?.toString?.();
  const entityId = entity._id?.toString();
  if (!entityId || !sharedId || !language || !title) {
    throw new Error(`Missing required entity fields for generatedToc update on ${entity.sharedId}`);
  }
  if (!template) {
    legacyLogger.info(
      `Skipping generatedToc entity update for sharedId ${sharedId}: entity is missing template`
    );
    return null;
  }

  const documents = (entity.documents || [])
    .filter(
      (
        doc: FileType
      ): doc is FileType & { _id: NonNullable<FileType['_id']>; originalname: string } =>
        Boolean(doc._id && doc.originalname)
    )
    .map((doc: FileType & { _id: NonNullable<FileType['_id']>; originalname: string }) => ({
      _id: doc._id.toString(),
      originalname: doc.originalname,
    }));
  const attachments = (entity.attachments || [])
    .filter((attachment: FileType): attachment is FileType & { originalname: string } =>
      Boolean(attachment.originalname)
    )
    .map((attachment: FileType & { originalname: string }) => ({
      _id: attachment._id?.toString(),
      originalname: attachment.originalname,
      ...(attachment.url ? { url: attachment.url } : {}),
    }));

  return {
    _id: entityId,
    sharedId,
    language,
    title,
    template,
    generatedToc,
    documents,
    attachments,
  };
};

const saveToc = async (_file: FileType, toc: TocSchema[]) => {
  const existingFile = (
    await FilesDataSourceFactory.default().getById(_file._id!.toString())
  ).getDataOrThrow();

  await ExecutionContext.transactionManager.run(async () =>
    FilesServiceFactory.default().bulkUpsert([existingFile.update({ toc, generatedToc: true })])
  );

  const [entity] = await entities.get({ sharedId: _file.entity }, '+permissions');
  await ensureEntityActor(entity);
  const payload = toEntityUpdatePayload(entity, true);
  if (payload) {
    await EntityFacade.update(payload, payload.language as LanguageISO6391);
  }
};

const generateToc = async (
  url: string,
  filename: string,
  fileContents: Buffer
): Promise<TocSchema[]> => {
  const response = await request.uploadFile(url, filename, fileContents);

  let toc = JSON.parse(response.text);
  if (!toc.length) {
    toc = [fakeTocEntry('ERROR: Toc was generated empty')];
  }
  return toc;
};

const handleError = async (e: { code?: string; message: string }, file: FileType) => {
  if (e?.code !== 'ECONNREFUSED' && e?.code !== 'ECONNRESET') {
    const toc = [fakeTocEntry('ERROR: Toc generation throwed an error'), fakeTocEntry(e.message)];
    await saveToc(file, toc);
  }
};

const tocService = {
  async processAllTenants() {
    return Object.keys(tenants.tenants).reduce(async (previous, tenantName) => {
      await previous;
      return runInJobContext(tenantName, async () => {
        permissionsContext.setCommandContext();
        const { features } = await settings.get({}, 'features.tocGeneration');
        if (features?.tocGeneration) {
          await this.processNext(features.tocGeneration.url);
        }
      });
    }, Promise.resolve());
  },

  async processNext(url: string) {
    const nextFile = (await FilesDAOFactory.default().getNextDocumentWithoutToc()).getData(null);

    if (nextFile && nextFile.filename) {
      try {
        await saveToc(
          nextFile,
          await generateToc(
            url,
            nextFile.filename,
            await storage.fileContents(nextFile.filename, 'document')
          )
        );
      } catch (e) {
        await handleError(e, nextFile);
        legacyLogger.error(prettifyError(e).prettyMessage);
      }
    }
  },
};

export { tocService };
