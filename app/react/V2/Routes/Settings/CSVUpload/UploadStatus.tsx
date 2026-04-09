import React from 'react';
import { useLoaderData } from 'react-router';
import { ArrowLeftIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { SettingsContent } from '#V2/Components/Layouts/SettingsContent.js';
import { Button } from '#V2/Components/UI/index.js';
import { I18NLinkV2, Translate } from '#app/I18N/index.js';
import { CsvImportListRow } from '#app/V2/api/csv/index.js';

const UploadStatus = () => {
  const entry = useLoaderData() as CsvImportListRow | undefined;

  return (
    <div className="w-full h-full overflow-y-auto">
      <SettingsContent>
        <SettingsContent.Header
          path={new Map([['Import CSV', '/settings/csv']])}
          title={entry?.file.originalName || <Translate>Not Found</Translate>}
        />
        <SettingsContent.Body className="flex flex-col overflow-y-auto">test</SettingsContent.Body>
        <SettingsContent.Footer>
          <I18NLinkV2 to="settings/csv" className="float-left">
            <Button type="button" className="flex flex-row gap-2 items-center">
              <ArrowLeftIcon className="w-4 h-4" />
              <Translate>Back</Translate>
            </Button>
          </I18NLinkV2>
          <Button type="button" className="float-right flex flex-row gap-2 items-center">
            <XMarkIcon className="w-4 h-4" />
            <Translate>Cancel</Translate>
          </Button>
        </SettingsContent.Footer>
      </SettingsContent>
    </div>
  );
};

export { UploadStatus };
