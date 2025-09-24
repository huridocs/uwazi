// @ts-expect-error TS(2307): Cannot find module '../templates.v2/model/Template... Remove this comment to see the full error message
import { Template } from 'api/templates.v2/model/Template.js';

interface PageService {
  ensurePageIsValid(template: Template): Promise<void>;
}

export type { PageService };
