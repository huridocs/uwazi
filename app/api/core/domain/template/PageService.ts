
import { Template } from '#api/templates.v2/model/Template.js';

interface PageService {
  ensurePageIsValid(template: Template): Promise<void>;
}

export type { PageService };
