import { Template } from '#api/core/domain/template/Template.js';

interface PageService {
  ensurePageIsValid(template: Template): Promise<void>;
}

export type { PageService };
