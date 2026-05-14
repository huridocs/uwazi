/* eslint-disable max-lines */
import React, { useEffect, useMemo, useState } from 'react';
import { useLoaderData, useRevalidator } from 'react-router';
import { useAtomValue } from 'jotai';
import { ArrowLeftIcon, XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/solid';
import throttle from 'lodash/throttle.js';
import { SettingsContent } from '#V2/Components/Layouts/SettingsContent.js';
import { Button, Card } from '#V2/Components/UI/index.js';
import { CsvImportListRow, CsvImportStatus } from '#V2/api/csv/index.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { I18NLinkV2, Translate } from '#app/I18N/index.js';
import { socket } from '#app/socket.js';
import { statusMessages } from './Components/statusMessages.js';
import { DateDisplay } from './Components/DateDisplay.js';
import { Progress } from './Components/Progress.js';
import { csvImportEvents } from '#app/V2/api/csv/events.js';
import { CancelProcessModal } from './Components/CancelProcessModal.js';
import { ErrorsTable } from './Components/ErrorsTable.js';

const UploadStatus = () => {
  const revalidator = useRevalidator();
  const entry = useLoaderData() as CsvImportListRow | undefined;
  const templates = useAtomValue(templatesAtom);
  const [cancelModal, setCancelModal] = useState(false);
  const fileName = entry?.file.originalName || <Translate>Not Found</Translate>;
  const canCancel = !(
    entry?.status === CsvImportStatus.Cancelled ||
    entry?.status === CsvImportStatus.Completed ||
    entry?.status === CsvImportStatus.Failed ||
    entry?.status === CsvImportStatus.ImportEntitiesDone
  );

  const templateName = useMemo(
    () => templates.find(template => template._id === entry?.templateId)?.name || '',
    [entry, templates]
  );

  const progressTotal = entry?.progress?.totalRows || 0;
  const progressCurrent = entry?.progress?.processedRows || 0;
  const completionPercent =
    progressTotal > 0 ? Math.round((progressCurrent / progressTotal) * 100) : 0;

  const statusMessage = useMemo(() => {
    if (entry?.status === CsvImportStatus.ImportEntitiesDone) {
      const hasFailed = Boolean(entry?.stats?.rowsFailed);
      const entitiesCreated = entry?.stats?.entitiesCreated;

      if (hasFailed) {
        return statusMessages.failed;
      }

      if (entitiesCreated === 0) {
        return statusMessages.completed;
      }
    }

    return entry ? statusMessages[entry.status] : undefined;
  }, [entry]);

  useEffect(() => {
    const doRevalidation = throttle(async (payload: { importId: string }) => {
      if (payload.importId === entry?.id) {
        await revalidator.revalidate();
      }
    }, 3000);

    const trackedEvents = [
      csvImportEvents.extractStart,
      csvImportEvents.extractProgress,
      csvImportEvents.extractSuccess,
      csvImportEvents.extractError,
      csvImportEvents.preflightScanStart,
      csvImportEvents.preflightScanSuccess,
      csvImportEvents.preflightScanError,
      csvImportEvents.preflightThesauriCreateStart,
      csvImportEvents.preflightThesauriCreateSuccess,
      csvImportEvents.preflightThesauriCreateError,
      csvImportEvents.preflightRelationshipsCreateStart,
      csvImportEvents.preflightRelationshipsCreateSuccess,
      csvImportEvents.preflightRelationshipsCreateError,
      csvImportEvents.importStart,
      csvImportEvents.importProgress,
      csvImportEvents.importSuccess,
      csvImportEvents.importError,
    ] as const;

    trackedEvents.forEach(event => {
      socket.on(event, doRevalidation);
    });

    return () => {
      trackedEvents.forEach(event => {
        socket.off(event, doRevalidation);
      });
    };
  }, [entry, revalidator]);

  return (
    <div className="w-full h-full overflow-y-auto">
      <SettingsContent>
        <SettingsContent.Header
          path={new Map([['Import CSV', '/settings/csv']])}
          title={fileName}
        />
        <SettingsContent.Body className="flex flex-col overflow-y-auto">
          {entry && (
            <>
              <div
                className="flex flex-col gap-4 border-b pb-4"
                style={{
                  borderColor:
                    'color-mix(in srgb, var(--color-theme-border-default) 40%, transparent)',
                }}
              >
                <div className="flex flex-row gap-2 items-baseline">
                  <span className="text-xl font-semibold">{fileName}</span>
                  <span
                    className="rounded-md border px-1"
                    style={{
                      borderColor:
                        'color-mix(in srgb, var(--color-theme-border-default) 60%, transparent)',
                      color: 'var(--color-theme-text-secondary)',
                      backgroundColor: 'var(--color-theme-surface-warm)',
                    }}
                  >
                    {statusMessage?.title}
                  </span>
                </div>
                <p className="text-ink-secondary">{statusMessage?.description}</p>
                <div className="flex flex-row items-center gap-10 text-ink-muted">
                  <div>
                    <Translate>Template</Translate>:{' '}
                    <Translate context={entry.templateId}>{templateName}</Translate>
                  </div>
                  <div>
                    <Translate>Date</Translate>: <DateDisplay value={entry.createdAt} />
                  </div>
                  <div>
                    <Translate>Last updated</Translate>: <DateDisplay value={entry.updatedAt} />
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 pt-6">
                <Card className="grow">
                  <div className="flex flex-col gap-4">
                    <Translate>Entities created</Translate>
                    <span className="text-2xl font-bold text-ink">
                      {entry.stats?.entitiesCreated || '-'}
                    </span>
                  </div>
                </Card>
                <Card className="grow">
                  <div className="flex flex-col gap-4">
                    <Translate>Rows processed</Translate>
                    <span className="text-2xl font-bold text-ink">
                      {entry.stats?.rowsProcessed || '-'}
                    </span>
                  </div>
                </Card>
                <Card className="grow">
                  <div className="flex flex-col gap-4">
                    <Translate>Rows failed</Translate>
                    <span className="text-2xl font-bold text-ink">
                      {entry.stats?.rowsFailed || '-'}
                    </span>
                  </div>
                </Card>
                <Card className="grow">
                  <div className="flex flex-col gap-4">
                    <Translate>Thesauri values created</Translate>
                    <span className="text-2xl font-bold text-ink">
                      {entry.stats?.thesaurusValuesCreated || '-'}
                    </span>
                  </div>
                </Card>
                <Card className="grow">
                  <div className="flex flex-col gap-4">
                    <Translate>Related entities created</Translate>
                    <span className="text-2xl font-bold text-ink">
                      {entry.stats?.relationshipValuesCreated || '-'}
                    </span>
                  </div>
                </Card>
              </div>
              {entry.failure && entry.status === CsvImportStatus.Failed ? (
                <div className="pt-6">
                  <Translate className="text-xl font-semibold pb-4 block">
                    Failure details
                  </Translate>
                  <Card>
                    <div className="flex flex-col gap-3">
                      <div className="font-medium text-ink">{entry.failure.message}</div>
                      <div className="flex flex-wrap gap-6 text-sm text-ink-secondary">
                        <div>
                          <Translate>Stage</Translate>: {entry.failure.stage}
                        </div>
                        <div>
                          <Translate>Code</Translate>: {entry.failure.code || '-'}
                        </div>
                        <div>
                          <Translate>Retryable</Translate>:{' '}
                          {entry.failure.retryable ? (
                            <Translate>Yes</Translate>
                          ) : (
                            <Translate>No</Translate>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              ) : null}
              <div className="pt-6">
                <Translate className="text-xl font-semibold pb-4 block">Progress</Translate>
                <Progress
                  current={progressCurrent}
                  total={progressTotal}
                  status={entry.status}
                  stats={entry.stats}
                />
                <p className="pt-2 text-sm text-ink-secondary">
                  <Translate>Processed rows</Translate>: {completionPercent}%
                </p>
              </div>
              {entry.rowErrors?.length ? (
                <div className="pt-6">
                  <ErrorsTable errors={entry.rowErrors} />
                </div>
              ) : undefined}
            </>
          )}
        </SettingsContent.Body>
        <SettingsContent.Footer>
          <I18NLinkV2 to="settings/csv" className="float-left">
            <Button type="button" variant="secondary" className="flex flex-row gap-2 items-center">
              <ArrowLeftIcon className="w-4 h-4" />
              <Translate>Back</Translate>
            </Button>
          </I18NLinkV2>
          <div className="float-right flex flex-wrap flex-row gap-2">
            {entry?.rowErrors?.length ? (
              <a
                href={`/api/csvImportEntities/imports/${entry.id}/failed-rows-csv`}
                target="_blank"
                rel="noreferrer"
                className="float-left"
              >
                <Button type="button" variant="ghost" className="flex flex-row gap-2 items-center">
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  <Translate>Download failed rows</Translate>
                </Button>
              </a>
            ) : undefined}
            <Button
              type="button"
              variant="danger"
              className="flex flex-row gap-2 items-center"
              onClick={() => setCancelModal(true)}
              disabled={!canCancel}
            >
              <XMarkIcon className="w-4 h-4" />
              <Translate>Cancel</Translate>
            </Button>
          </div>
        </SettingsContent.Footer>
      </SettingsContent>
      {entry && (
        <CancelProcessModal
          isOpen={cancelModal}
          onClose={() => setCancelModal(false)}
          entryId={entry.id}
        />
      )}
    </div>
  );
};
export { UploadStatus };
