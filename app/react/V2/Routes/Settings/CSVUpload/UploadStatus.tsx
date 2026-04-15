import React, { useEffect, useMemo, useState } from 'react';
import { useLoaderData, useRevalidator } from 'react-router';
import { useAtomValue } from 'jotai';
import { ArrowLeftIcon, XMarkIcon } from '@heroicons/react/24/solid';
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

  const statusMessage = entry ? statusMessages[entry.status] : undefined;

  const progressTotal = entry?.progress?.totalRows || 0;
  const progressCurrent = entry?.progress?.processedRows || 0;
  const completionPercent =
    progressTotal > 0 ? Math.round((progressCurrent / progressTotal) * 100) : 0;

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
          {entry ? (
            <>
              <div className="flex flex-col gap-4 border-b pb-4">
                <div className="flex flex-row gap-2 items-baseline">
                  <span className="text-xl font-semibold">{fileName}</span>
                  <span className="px-1 border text-gray-500 rounded-md">
                    {statusMessage?.title}
                  </span>
                </div>
                <p className="text-gray-600">{statusMessage?.description}</p>
                <div className="flex flex-row gap-10 items-center text-gray-500">
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
                    <span className="font-bold text-2xl text-gray-900">
                      {entry.stats?.entitiesCreated || '-'}
                    </span>
                  </div>
                </Card>
                <Card className="grow">
                  <div className="flex flex-col gap-4">
                    <Translate>Rows processed</Translate>
                    <span className="font-bold text-2xl text-gray-900">
                      {entry.stats?.rowsProcessed || '-'}
                    </span>
                  </div>
                </Card>
                <Card className="grow">
                  <div className="flex flex-col gap-4">
                    <Translate>Rows failed</Translate>
                    <span className="font-bold text-2xl text-gray-900">
                      {entry.stats?.rowsFailed || '-'}
                    </span>
                  </div>
                </Card>
                <Card className="grow">
                  <div className="flex flex-col gap-4">
                    <Translate>Thesauri values created</Translate>
                    <span className="font-bold text-2xl text-gray-900">
                      {entry.stats?.thesaurusValuesCreated || '-'}
                    </span>
                  </div>
                </Card>
                <Card className="grow">
                  <div className="flex flex-col gap-4">
                    <Translate>Related entities created</Translate>
                    <span className="text-bold text-2xl text-gray-900">
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
                      <div className="text-gray-900 font-medium">{entry.failure.message}</div>
                      <div className="text-gray-600 text-sm flex flex-wrap gap-6">
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
                <p className="text-sm text-gray-600 pt-2">
                  <Translate>Processed rows</Translate>: {completionPercent}%
                </p>
              </div>
            </>
          ) : (
            <div>{fileName}</div>
          )}
        </SettingsContent.Body>
        <SettingsContent.Footer>
          <I18NLinkV2 to="settings/csv" className="float-left">
            <Button type="button" styling="outline" className="flex flex-row gap-2 items-center">
              <ArrowLeftIcon className="w-4 h-4" />
              <Translate>Back</Translate>
            </Button>
          </I18NLinkV2>
          <Button
            type="button"
            color="error"
            className="float-right flex flex-row gap-2 items-center"
            onClick={() => {
              setCancelModal(true);
            }}
            disabled={!canCancel}
          >
            <XMarkIcon className="w-4 h-4" />
            <Translate>Cancel</Translate>
          </Button>
        </SettingsContent.Footer>
      </SettingsContent>
      {entry && (
        <CancelProcessModal
          isOpen={cancelModal}
          onClose={() => {
            setCancelModal(false);
          }}
          entryId={entry.id}
        />
      )}
    </div>
  );
};

export { UploadStatus };
