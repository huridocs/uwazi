import { z } from 'zod';
import entities from '#api/entities/index.js';
import { documents } from '#api/documents/documents.js';
import { FilesDAOFactory } from '#api/core/infrastructure/factories/FilesDAOFactory.js';
import { defineTool, type ToolContext } from './Tool.js';
import { toJsonSafe, truncateText } from './serialize.js';

const assertCanReadFile = async (fileId: string, ctx: ToolContext) => {
  const file = (await FilesDAOFactory.default().getById(fileId)).getData(null);
  if (!file) {
    throw new Error('document does not exists');
  }

  if (ctx.actor.role === 'admin' || file.type === 'custom' || !file.entity) {
    return;
  }

  const visible = await entities.get({ sharedId: file.entity }, 'sharedId', {
    withoutDocuments: true,
  });
  if (!visible.length) {
    throw new Error('document does not exists');
  }
};

const documentsPageTool = defineTool({
  name: 'documents_page',
  domain: 'documents',
  sideEffect: 'read',
  description:
    'Get extracted text for one PDF page of a document file (_id is the file id, page is 1-based). The user must be able to see the parent entity.',
  parameters: z.object({
    _id: z.string().min(1),
    page: z.number().int().min(1),
  }),
  execute: async (args, ctx) => {
    await assertCanReadFile(args._id, ctx);
    const text = await documents.page(args._id, args.page);
    return toJsonSafe({ page: args.page, text: truncateText(String(text), 20_000) });
  },
});

const documentsFulltextTool = defineTool({
  name: 'documents_fulltext',
  domain: 'documents',
  sideEffect: 'read',
  description:
    'Get extracted full text of a PDF (pages joined by form-feed). _id is the file id. The user must be able to see the parent entity.',
  parameters: z.object({
    _id: z.string().min(1),
  }),
  execute: async (args, ctx) => {
    await assertCanReadFile(args._id, ctx);
    const text = await documents.fullText(args._id);
    return toJsonSafe({ text: truncateText(String(text), 80_000) });
  },
});

export { documentsFulltextTool, documentsPageTool };
