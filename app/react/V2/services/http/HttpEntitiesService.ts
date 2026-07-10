import { t } from '#app/I18N/index.js';
import { isClient } from '#app/utils/index.js';
import { ApiError } from '#shared/apiClient/index.js';
import { getStore } from '#shared/atomStore/index.js';
import * as entitiesApi from '#V2/api/entities/index.js';
import { requestStatusAtom } from '#V2/atoms/requestStatusAtom.js';
import type { NotificationType } from '#V2/atoms/requestStatusTypes.js';
import { createUuid } from '#V2/utils/uuid.js';
import type { EntitiesService, EntitySaveInput } from '../contracts/EntitiesService.js';
import type { ServiceRequestOptions } from '../contracts/ServiceRequestOptions.js';

const toWarning = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return JSON.stringify(error) ?? String(error);
};

const notify = (type: NotificationType, title: string, details?: string) => {
  if (!isClient) return;
  const id = createUuid();
  getStore().set(requestStatusAtom, prev => ({
    ...prev,
    notifications: [
      ...prev.notifications,
      { id, type, title, message: undefined, details, timestamp: new Date() },
    ],
    unreadNotificationIds: [...prev.unreadNotificationIds, id],
  }));
};

const notifyUpsertSuccess = (warnings: string[] | undefined, notifySuccess: boolean) => {
  if (!notifySuccess) return;
  if (warnings?.length) {
    notify('warning', t('System', 'Saved with warnings', null, false), warnings.join('\n'));
    return;
  }
  notify('success', t('System', 'Saved successfully.', null, false));
};

const httpEntitiesService: EntitiesService = {
  getById: async (id, { language, omitRelationships, headers }) =>
    entitiesApi.getById({
      _id: id,
      language,
      omitRelationships,
      headers,
    }),

  getBySharedId: async (sharedId, { language, omitRelationships, headers }) =>
    entitiesApi.getBySharedId({ sharedId, language, omitRelationships }, headers),

  upsert: async (entity: EntitySaveInput, options: ServiceRequestOptions = {}) => {
    const { headers, notifySuccess = true, signal } = options;
    const [data, error] = await entitiesApi.saveWithFiles(entity, { headers, signal });
    if (error || !data) return [undefined, error];
    if (!data.entity) {
      return [
        undefined,
        new ApiError('Save response missing entity', {
          kind: 'parse',
          status: 200,
          code: 'missing_entity',
          detail: 'The server did not return the saved entity.',
          retryable: false,
        }),
      ];
    }

    const warnings = data.errors?.map(toWarning);
    notifyUpsertSuccess(warnings, notifySuccess);
    return [data.entity];
  },

  delete: async (sharedIds, { headers } = {}) => entitiesApi.remove(sharedIds, headers),
};

export { httpEntitiesService };
