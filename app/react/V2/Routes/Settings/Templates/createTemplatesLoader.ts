import { IncomingHttpHeaders } from 'http';
import { LoaderFunction } from 'react-router';
import { t } from '#app/I18N/index.js';
import type { V2Services } from '#V2/services/types.js';
import { apiErrorToRequestError } from '#V2/shared/errorUtils.js';
import type { TemplateRow } from './types.js';

/**
 * Loader factory for the Templates settings list route.
 *
 * Does not import or default to any service implementation — the caller
 * (getRoutes, entry-server, or tests) injects the `V2Services` bundle.
 */
const createTemplatesLoader =
  (services: V2Services) =>
  (headers?: IncomingHttpHeaders): LoaderFunction<TemplateRow[]> =>
  async () => {
    const [templates, templatesError] = await services.templates.getAll({ headers });
    if (templatesError) throw apiErrorToRequestError(templatesError);

    const templateIds = templates.map(template => template._id);
    const [entityCounts, countsError] = await services.templates.checkEntityCounts(templateIds, {
      headers,
    });
    if (countsError) throw apiErrorToRequestError(countsError);

    return templates.map(template => {
      const reasons = [];
      if (template.default) {
        reasons.push(t('System', 'A default template cannot be deleted.', null, false));
      }
      if ((entityCounts[template._id] || 0) > 0) {
        reasons.push(
          t(
            'System',
            'This template is in use by existing entities and cannot be deleted.',
            null,
            false
          )
        );
      }
      if (template.synced) {
        reasons.push(t('System', 'Synced templates cannot be deleted.', null, false));
      }

      const disableRowSelection = reasons.length > 0 ? reasons.join(' ') : undefined;

      return {
        ...template,
        rowId: template._id,
        translation: template.name,
        entityCount: entityCounts[template._id] || 0,
        disableRowSelection,
      };
    });
  };

export { createTemplatesLoader };
