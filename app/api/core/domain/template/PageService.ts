import { Template } from 'api/templates.v2/model/Template';

interface PageService {
  ensurePageIsValid(template: Template): Promise<void>;
}

export type { PageService };
