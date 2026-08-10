import { EntitiesDAOFactory } from '#api/core/infrastructure/factories/EntitiesDAOFactory.js';
import { TemplatesDAOFactory } from '#api/core/infrastructure/factories/TemplatesDAOFactory.js';
import { User } from '#api/users.v2/model/User.js';
import type { Template } from '#shared/contracts/Template.js';
import { toApiError } from '#shared/apiClient/index.js';
import type { ApiResponse } from '#V2/api/ApiResponse.js';
import type { TemplatesService } from '../contracts/TemplatesService.js';
import type { ServiceRequestOptions } from '../contracts/ServiceRequestOptions.js';
import { notImplemented } from './notImplemented.js';
import type { ServerServiceContext } from './types.js';

/** Mongo ObjectIds → strings, matching HTTP JSON serialization. */
const serializeTemplate = (
  template: { _id: { toString(): string } } & Record<string, unknown>
): Template => {
  const { _id, ...rest } = template;
  return {
    ...(rest as Omit<Template, '_id'>),
    _id: _id.toString(),
  };
};

const serializeTemplates = (
  rows: Array<{ _id: { toString(): string } } & Record<string, unknown>>
): Template[] => rows.map(serializeTemplate);

const createServerTemplatesService = (ctx: ServerServiceContext): TemplatesService => ({
  getAll: async (_options?: ServiceRequestOptions): Promise<ApiResponse<Template[]>> => {
    try {
      const rows = await TemplatesDAOFactory.default().get();
      return [
        serializeTemplates(
          rows as Array<{ _id: { toString(): string } } & Record<string, unknown>>
        ),
        undefined,
      ];
    } catch (e) {
      return [undefined as never, toApiError(e)];
    }
  },

  getById: async (
    id: string,
    _options?: ServiceRequestOptions
  ): Promise<ApiResponse<Template | undefined>> => {
    try {
      const rows = await TemplatesDAOFactory.default().get([id]);
      const [serialized] = serializeTemplates(
        rows as Array<{ _id: { toString(): string } } & Record<string, unknown>>
      );
      return [serialized, undefined];
    } catch (e) {
      return [undefined, toApiError(e)];
    }
  },

  checkEntityCounts: async (
    templateIds: string[],
    _options?: ServiceRequestOptions
  ): Promise<ApiResponse<Record<string, number>>> => {
    try {
      if (!templateIds.length) {
        return [{}];
      }

      const dao = EntitiesDAOFactory.default({
        user: User.createFrom(ctx.user ?? null),
      });
      const entries = await Promise.all(
        templateIds.map(async id => [id, await dao.countByTemplate(id)] as const)
      );
      return [Object.fromEntries(entries)];
    } catch (e) {
      return [undefined as never, toApiError(e)];
    }
  },

  upsert: async () => notImplemented<Template>(),

  delete: async () => notImplemented<void>(),

  setDefault: async () => notImplemented<Template>(),
});

export { createServerTemplatesService };
