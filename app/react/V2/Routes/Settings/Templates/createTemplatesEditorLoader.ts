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
const entityViewPageOptions = (allPages: unknown) =>
  (Array.isArray(allPages) ? allPages : [])
    .filter((page: Page) => page.entityView)
    .map((page: Page) => ({ value: page.sharedId, label: page.title }));

const loadEditedTemplate = async ({
  services,
  headers,
  templates,
  templateId,
}: {
  services: V2Services;
  headers?: IncomingHttpHeaders;
  templates: { _id: string }[];
  templateId?: string;
}) => {
  const blank = { ...emptyTemplate, color: getRandomColor() };
  if (!templateId) return { loadedTemplate: blank, entityCount: 0 };

  const templateToEdit = templates.find(template => template._id === templateId);
  if (!templateToEdit) return { loadedTemplate: blank, entityCount: 0 };

  const [count, countsError] = await services.templates.checkEntityCount(templateToEdit._id, {
    headers,
  });
  if (countsError) throw apiErrorToRequestError(countsError);

  const loadedTemplate: ClientTemplateSchema = templateToEdit as ClientTemplateSchema;
  return { loadedTemplate, entityCount: count };
};

const createTemplatesEditorLoader =
  (services: V2Services) =>
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async ({ params }) => {
    const pagesOptions = entityViewPageOptions(await pagesAPI.get(headers));
    const [templates, templatesError] = await services.templates.getAll({ headers });
    if (templatesError) throw apiErrorToRequestError(templatesError);

    const { loadedTemplate, entityCount } = await loadEditedTemplate({
      services,
      headers,
      templates,
      templateId: params.templateId,
    });
    return { loadedTemplate, pagesOptions, entityCount };
  };

export { createTemplatesEditorLoader };
