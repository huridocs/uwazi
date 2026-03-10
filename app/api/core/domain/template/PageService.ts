import { Template } from 'api/core/domain/template/Template';

interface PageService {
  ensurePageIsValid(template: Template): Promise<void>;
}

export type { PageService };
