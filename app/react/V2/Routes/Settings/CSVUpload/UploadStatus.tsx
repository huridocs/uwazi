import React, { useMemo } from 'react';
import { useLoaderData } from 'react-router';
import { useAtomValue } from 'jotai';
import { ArrowLeftIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { SettingsContent } from '#V2/Components/Layouts/SettingsContent.js';
import { Button, Card } from '#V2/Components/UI/index.js';
import { CsvImportListRow, CsvImportStatus } from '#V2/api/csv/index.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { I18NLinkV2, Translate } from '#app/I18N/index.js';
import { statusMessages } from './Components/statusMessages.js';
import { DateDisplay } from './Components/DateDisplay.js';
import { Progress } from './Components/Progress.js';

const UploadStatus = () => {
  const entry = useLoaderData() as CsvImportListRow | undefined;
  const templates = useAtomValue(templatesAtom);

  const templateName = useMemo(
    () => templates.find(template => template._id === entry?.templateId)?.name || '',
    [entry, templates]
  );

  const fileName = entry?.file.originalName || <Translate>Not Found</Translate>;

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
                    {statusMessages[entry.status]}
                  </span>
                </div>
                <div className="flex flex-row gap-10 items-center text-gray-500">
                  <div>
                    <Translate>Template</Translate>:{' '}
                    <Translate context={entry.templateId}>{templateName}</Translate>
                  </div>
                  <div>
                    <Translate>Date</Translate>: <DateDisplay value={entry.createdAt} />
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
                    <Translate>Thesauri touched</Translate>
                    <span className="font-bold text-2xl text-gray-900">
                      {entry.stats?.thesauriTouched || '-'}
                    </span>
                  </div>
                </Card>
                <Card className="grow">
                  <div className="flex flex-col gap-4">
                    <Translate>Relationships</Translate>
                    <span className="text-bold text-2xl text-gray-900">
                      {entry.stats?.relationshipValuesCreated || '-'}
                    </span>
                  </div>
                </Card>
              </div>
              <div className="pt-6">
                <Translate className="text-xl font-semibold pb-4 block">Progress</Translate>
                <Progress
                  current={entry.progress?.processedRows || 0}
                  total={entry.progress?.totalRows || 0}
                  failed={!!entry.stats?.rowsFailed}
                  canceled={entry.status === CsvImportStatus.Cancelled}
                />
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
          >
            <XMarkIcon className="w-4 h-4" />
            <Translate>Cancel</Translate>
          </Button>
        </SettingsContent.Footer>
      </SettingsContent>
    </div>
  );
};

export { UploadStatus };
