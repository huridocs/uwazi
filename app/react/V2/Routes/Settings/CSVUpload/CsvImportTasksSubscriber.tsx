import { useEffect, useRef } from 'react';
import { useAtomValue } from 'jotai';
import { getStore } from '#shared/atomStore/index.js';
import { t } from '#app/I18N/index.js';
import { socket } from '#app/socket.js';
import { csvImportEvents } from '#V2/api/csv/events.js';
import type { CsvImportEventPayloads } from '#V2/api/csv/events.js';
import { get, CsvImportStatus } from '#V2/api/csv/index.js';
import { requestStatusAtom, useRequestStatus } from '#V2/atoms/requestStatusAtom.js';
import { userAtom } from '#V2/atoms/userAtom.js';
import {
  buildHydrationLabel,
  computeProgressFromRow,
  handleCsvImportSocketEvent,
  isActiveImportForTask,
  mergeTaskLabel,
  shouldCloseTaskForImportStatus,
  type CsvImportTaskHandlers,
} from './csvImportTaskProgress.js';

const CsvImportTasksSubscriber = () => {
  const user = useAtomValue(userAtom);
  const { registerTask, updateTask, endTask, notify } = useRequestStatus();
  const registeredTaskIdsRef = useRef<Set<string>>(new Set());
  const isHydratingRef = useRef(false);

  const requestStatusRef = useRef({ registerTask, updateTask, endTask, notify });
  requestStatusRef.current = { registerTask, updateTask, endTask, notify };

  const handlersRef = useRef<CsvImportTaskHandlers>({
    ensureTask: () => {},
    updateTask: () => {},
    completeTask: () => {},
    failTask: () => {},
    notifySuccess: () => {},
    notifyError: () => {},
    notifyCancelled: () => {},
  });

  const getExistingTaskLabel = (importId: string) =>
    getStore()
      .get(requestStatusAtom)
      .tasks.find(task => task.id === importId)?.label;

  handlersRef.current = {
    ensureTask: (importId: string, label: string, progress?: number) => {
      const { registerTask: register, updateTask: update } = requestStatusRef.current;
      const mergedLabel = mergeTaskLabel(getExistingTaskLabel(importId), label);
      if (!registeredTaskIdsRef.current.has(importId)) {
        register(importId, mergedLabel, undefined, progress);
        registeredTaskIdsRef.current.add(importId);
        return;
      }
      update(importId, {
        label: mergedLabel,
        ...(progress !== undefined && { progress }),
      });
    },
    updateTask: (importId, updates) => {
      requestStatusRef.current.updateTask(importId, updates);
    },
    completeTask: importId => {
      registeredTaskIdsRef.current.delete(importId);
      requestStatusRef.current.endTask(importId, 'completed');
    },
    failTask: importId => {
      registeredTaskIdsRef.current.delete(importId);
      requestStatusRef.current.endTask(importId, 'failed');
    },
    notifySuccess: () => {
      requestStatusRef.current.notify('success', t('System', 'CSV import completed', null, false));
    },
    notifyError: (_fileName, message) => {
      requestStatusRef.current.notify(
        'error',
        t('System', 'CSV import failed', null, false),
        undefined,
        message
      );
    },
    notifyCancelled: () => {
      requestStatusRef.current.notify('info', t('System', 'CSV import cancelled', null, false));
    },
  };

  const hydrateAndReconcileRef = useRef(async () => {
    if (isHydratingRef.current) {
      return;
    }
    isHydratingRef.current = true;
    try {
      const rows = await get();
      if (!Array.isArray(rows)) {
        return;
      }

      const rowsById = new Map(rows.map(row => [row.id, row]));

      const { registerTask: register, updateTask: update, endTask: end } = requestStatusRef.current;

      const activeImportIds = new Set<string>();

      rows.forEach(row => {
        if (isActiveImportForTask(row.status)) {
          activeImportIds.add(row.id);
          const label = buildHydrationLabel(row);
          const progress = computeProgressFromRow(row);
          if (!registeredTaskIdsRef.current.has(row.id)) {
            register(row.id, label, undefined, progress);
            registeredTaskIdsRef.current.add(row.id);
            return;
          }
          update(row.id, {
            label,
            ...(progress !== undefined && { progress }),
          });
          return;
        }

        if (shouldCloseTaskForImportStatus(row.status)) {
          registeredTaskIdsRef.current.delete(row.id);
        }
      });

      registeredTaskIdsRef.current.forEach(importId => {
        const row = rowsById.get(importId);
        if (!row || activeImportIds.has(importId)) {
          return;
        }
        registeredTaskIdsRef.current.delete(importId);
        if (row.status === CsvImportStatus.Failed) {
          end(importId, 'failed');
          return;
        }
        end(importId, 'completed');
      });
    } finally {
      isHydratingRef.current = false;
    }
  });

  useEffect(() => {
    if (user?.role !== 'admin') {
      return undefined;
    }

    const hydrate = () => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      hydrateAndReconcileRef.current();
    };

    const listenerEntries = Object.values(csvImportEvents).map(eventName => {
      const listener = (payload: CsvImportEventPayloads[keyof CsvImportEventPayloads]) => {
        handleCsvImportSocketEvent(eventName, payload, handlersRef.current);
      };
      socket.on(eventName, listener);
      return { eventName, listener };
    });

    socket.on('connect', hydrate);
    hydrate();

    return () => {
      listenerEntries.forEach(({ eventName, listener }) => {
        socket.off(eventName, listener);
      });
      socket.off('connect', hydrate);
    };
  }, [user?.role]);

  return null;
};

export { CsvImportTasksSubscriber };
