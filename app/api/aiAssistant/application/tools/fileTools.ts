import { z } from 'zod';
import entities from '#api/entities/index.js';
import { FilesDAOFactory } from '#api/core/infrastructure/factories/FilesDAOFactory.js';
import { defineTool } from './Tool.js';
import { toJsonSafe } from './serialize.js';

const fileQuerySchema = z.object({
  _id: z.string().optional(),
  type: z.string().optional(),
  entity: z.string().optional(),
});

type FileQuery = z.infer<typeof fileQuerySchema>;

const buildFileQuery = (args: FileQuery) => {
  const query: Record<string, unknown> = {};
  if (args._id) {
    query._id = args._id;
  }
  if (args.type) {
    query.type = args.type;
  }
  if (args.entity) {
    query.entity = args.entity;
  }
  return query;
};

const allowedEntityIds = async (sharedIds: string[]) => {
  if (!sharedIds.length) {
    return new Set<string>();
  }
  const visible = await entities.get({ sharedId: { $in: sharedIds } }, 'sharedId', {
    withoutDocuments: true,
  });
  return new Set(visible.map((entity: { sharedId: string }) => entity.sharedId));
};

const toFileRow = (file: {
  _id: unknown;
  originalname?: string;
  filename?: string;
  type?: string;
  entity?: string;
  language?: string;
  mimetype?: string;
  size?: number;
  status?: string;
}) => ({
  _id: file._id,
  originalname: file.originalname,
  filename: file.filename,
  type: file.type,
  entity: file.entity,
  language: file.language,
  mimetype: file.mimetype,
  size: file.size,
  status: file.status,
});

const filesListTool = defineTool({
  name: 'files_list',
  domain: 'files',
  sideEffect: 'read',
  description:
    'List files (documents, attachments, custom uploads). Only files whose entity the user can see are returned, same as GET /api/files.',
  parameters: fileQuerySchema,
  execute: async args => {
    const files = await FilesDAOFactory.default().getByQuery(buildFileQuery(args));
    const allowed = await allowedEntityIds(
      files.map(file => file.entity).filter((id): id is string => Boolean(id))
    );
    const visible = files.filter(file => !file.entity || allowed.has(file.entity)).map(toFileRow);
    return toJsonSafe({ rows: visible });
  },
});

export { filesListTool };
