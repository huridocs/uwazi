import { t } from '#app/I18N/index.js';
import { isClient } from '#app/utils/index.js';
import type { ApiClientEventBus, ApiError } from '#shared/apiClient/index.js';
import { getStore } from '#shared/atomStore/index.js';
import { startLoading, endLoading, requestStatusAtom } from '#V2/atoms/requestStatusAtom.js';
import type { NotificationType } from '#V2/atoms/requestStatusTypes.js';
import { createUuid } from '#V2/utils/uuid.js';

type Policy = { dispose: () => void };

const createLoadingPolicy = (
  eventBus: ApiClientEventBus,
  controls: { start: () => void; end: () => void }
): Policy => {
  const pending = new Set<string>();

  const trackStart = (id: string) => {
    if (!pending.has(id) && pending.size === 0) controls.start();
    pending.add(id);
  };

  const trackEnd = (id: string) => {
    if (pending.delete(id) && pending.size === 0) controls.end();
  };

  const disposeStart = eventBus.on('request:start', event => trackStart(event.id));
  const disposeSuccess = eventBus.on('request:success', event => trackEnd(event.id));
  const disposeError = eventBus.on('request:error', event => trackEnd(event.id));

  return {
    dispose: () => {
      disposeStart();
      disposeSuccess();
      disposeError();
    },
  };
};

const notificationForError = (error: ApiError) => {
  if (error.kind === 'network' || error.kind === 'timeout') {
    return {
      type: 'error' as NotificationType,
      title: t('System', 'Could not reach server. Please try again later.', null, false),
    };
  }
  if (error.status === 409) {
    return {
      type: 'warning' as NotificationType,
      title: t('System', error.code ?? error.message, null, false),
      details: error.detail,
    };
  }
  return {
    type: 'error' as NotificationType,
    title: t('System', 'An error occurred', null, false),
    details: error.detail ?? error.message,
  };
};

const createNotificationPolicy = (
  eventBus: ApiClientEventBus,
  notify: (type: NotificationType, title: string, message?: string, details?: string) => void
): Policy => ({
  dispose: eventBus.on('request:error', event => {
    if (event.policies?.notification === false) return;
    if (event.error.status === 401 || event.error.status === 404) return;
    if (event.error.kind === 'cancelled') return;

    const { type, title, details } = notificationForError(event.error);
    notify(type, title, undefined, details);
  }),
});

const createAuthPolicy = (
  eventBus: ApiClientEventBus,
  redirectToLogin: () => void = () => {
    window.location.assign('/login');
  }
): Policy => ({
  dispose: eventBus.on('request:error', event => {
    if (event.error.status === 401 && event.policies?.auth !== false) redirectToLogin();
  }),
});

const notifyFromPolicy = (
  type: NotificationType,
  title: string,
  message?: string,
  details?: string
) => {
  const id = createUuid();
  getStore().set(requestStatusAtom, prev => ({
    ...prev,
    notifications: [
      ...prev.notifications,
      { id, type, title, message, details, timestamp: new Date() },
    ],
    unreadNotificationIds: [...prev.unreadNotificationIds, id],
  }));
};

const wireBrowserPolicies = (eventBus: ApiClientEventBus) => {
  if (!isClient) return;

  createLoadingPolicy(eventBus, { start: startLoading, end: endLoading });
  createNotificationPolicy(eventBus, notifyFromPolicy);
  createAuthPolicy(eventBus);
};

export { createAuthPolicy, createLoadingPolicy, createNotificationPolicy, wireBrowserPolicies };
