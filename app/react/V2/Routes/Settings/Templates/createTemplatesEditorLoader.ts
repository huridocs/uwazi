import { IncomingHttpHeaders } from 'http';
import { LoaderFunction } from 'react-router';
import * as pagesAPI from '#V2/api/pages/index.js';
import type { V2Services } from '#V2/services/types.js';
import type { ClientTemplateSchema, Page } from '#V2/shared/types.js';
import { apiErrorToRequestError } from '#V2/shared/errorUtils.js';
import { emptyTemplate } from './helpers.js';
import { getRandomColor } from './components/defaultTemplateColors.js';

/**
 * Loader factory for the Templates editor route (new + edit).
 *
 * Does not import or default to any service implementation — the caller
 * (getRoutes, entry-server, or tests) injects the `V2Services` bundle.
 *
 * Pages still come from `#V2/api/pages` until a PagesService exists.
 */
const createTemplatesEditorLoader =
  (services: V2Services) =>
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async ({ params }) => {
    const allPages = await pagesAPI.get(headers);
    const pages = (Array.isArray(allPages) ? allPages : []).filter((page: Page) => page.entityView);
    const pagesOptions = pages.map((page: Page) => ({
      value: page.sharedId,
      label: page.title,
    }));

    let loadedTemplate: ClientTemplateSchema = { ...emptyTemplate, color: getRandomColor() };
    const [templates, templatesError] = await services.templates.getAll({ headers });
    if (templatesError) throw apiErrorToRequestError(templatesError);

    let entityCount = 0;

    if (params.templateId) {
      const templateToEdit = templates.find(template => template._id === params.templateId);
      if (templateToEdit) {
        const [entityCounts, countsError] = await services.templates.checkEntityCounts(
          [templateToEdit._id],
          { headers }
        );
        if (countsError) throw apiErrorToRequestError(countsError);
        entityCount = entityCounts[templateToEdit._id] || 0;
        loadedTemplate = templateToEdit as ClientTemplateSchema;
      }
    }

    return { loadedTemplate, pagesOptions, entityCount };
  };

export { createTemplatesEditorLoader };
