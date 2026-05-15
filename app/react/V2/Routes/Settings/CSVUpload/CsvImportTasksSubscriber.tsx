import { useEffect, useRef } from 'react';
import { useAtomValue } from 'jotai';
import { t } from '#app/I18N/index.js';
import { socket } from '#app/socket.js';
import { csvImportEvents } from '#V2/api/csv/events.js';
import type { CsvImportEventPayloads } from '#V2/api/csv/events.js';
import { get, CsvImportStatus, type CsvImportListRow } from '#V2/api/csv/index.js';
import { useRequestStatus } from '#V2/atoms/requestStatusAtom.js';
import { userAtom } from '#V2/atoms/userAtom.js';
import {
  buildHydrationLabel,
  computeProgressFromRow,
  handleCsvImportSocketEvent,
  isTerminalImportStatus,
  type CsvImportMeta,
  type CsvImportTaskHandlers,
} from './csvImportTaskProgress.js';

const isV2CsvImportEnabled = () =>
  typeof window !== 'undefined' && Boolean(window.__featureFlags__?.v2CSVImport);

const CsvImportTasksSubscriber = () => {
  const user = useAtomValue(userAtom);
  const { registerTask, updateTask, endTask, notify } = useRequestStatus();
  const metaCacheRef = useRef<Map<string, CsvImportMeta>>(new Map());
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
    getMeta: () => undefined,
  });

  handlersRef.current = {
    ensureTask: (importId: string, label: string, progress?: number) => {
      const { registerTask: register, updateTask: update } = requestStatusRef.current;
      if (!registeredTaskIdsRef.current.has(importId)) {
        register(importId, label, undefined, progress);
        registeredTaskIdsRef.current.add(importId);
        return;
      }
      update(importId, {
        label,
        ...(progress !== undefined && { progress }),
      });
    },
    updateTask: (importId, updates) => {
      requestStatusRef.current.updateTask(importId, updates);
    },
    completeTask: importId => {
      requestStatusRef.current.endTask(importId, 'completed');
    },
    failTask: importId => {
      requestStatusRef.current.endTask(importId, 'failed');
    },
    notifySuccess: fileName => {
      requestStatusRef.current.notify(
        'success',
        t('System', 'CSV import completed', null, false),
        fileName
      );
    },
    notifyError: (fileName, message) => {
      requestStatusRef.current.notify(
        'error',
        t('System', 'CSV import failed', null, false),
        fileName,
        message
      );
    },
    notifyCancelled: fileName => {
      requestStatusRef.current.notify(
        'info',
        t('System', 'CSV import cancelled', null, false),
        fileName
      );
    },
    getMeta: importId => metaCacheRef.current.get(importId),
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
      rows.forEach(row => {
        metaCacheRef.current.set(row.id, { fileName: row.file.originalName });
      });

      const { registerTask: register, updateTask: update, endTask: end } =
        requestStatusRef.current;

      rows
        .filter(row => !isTerminalImportStatus(row.status))
        .forEach(row => {
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
        });

      registeredTaskIdsRef.current.forEach(importId => {
        const row = rowsById.get(importId);
        if (!row) {
          return;
        }
        if (row.status === CsvImportStatus.Cancelled) {
          end(importId, 'completed');
          return;
        }
        if (row.status === CsvImportStatus.Failed) {
          end(importId, 'failed');
          return;
        }
        if (row.status === CsvImportStatus.Completed) {
          end(importId, 'completed');
        }
      });
    } finally {
      isHydratingRef.current = false;
    }
  });

  useEffect(() => {
    if (user?.role !== 'admin' || !isV2CsvImportEnabled()) {
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
