import type { Template, TemplateInput } from '#shared/contracts/Template.js';
import type { ApiResponse } from '#V2/api/ApiResponse.js';
import type { ServiceRequestOptions } from './ServiceRequestOptions.js';

/**
 * Templates domain service (settings list + editor).
 *
 * Standard reads: `getAll`, `getById`, `checkEntityCounts`, `checkEntityCount`.
 * Standard writes: `upsert`, `delete`, `setDefault`.
 */
interface TemplatesService {
  getAll(options?: ServiceRequestOptions): Promise<ApiResponse<Template[]>>;
  getById(id: string, options?: ServiceRequestOptions): Promise<ApiResponse<Template | undefined>>;
  checkEntityCounts(options?: ServiceRequestOptions): Promise<ApiResponse<Record<string, number>>>;
  checkEntityCount(
    templateId: string,
    options?: ServiceRequestOptions
  ): Promise<ApiResponse<number>>;
  upsert(template: TemplateInput, options?: ServiceRequestOptions): Promise<ApiResponse<Template>>;
  delete(ids: string[], options?: ServiceRequestOptions): Promise<ApiResponse<void>>;
  setDefault(id: string, options?: ServiceRequestOptions): Promise<ApiResponse<Template>>;
}

export type { TemplatesService, TemplateInput };
