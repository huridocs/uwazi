import React from 'react';
import { useLoaderData } from 'react-router';
import { DocumentIcon, PlusIcon } from '@heroicons/react/24/solid';
import { SettingsContent } from '#V2/Components/Layouts/SettingsContent.js';
import { BlankState, Button } from '#V2/Components/UI/index.js';
import { Translate } from '#app/I18N/index.js';
import { ImportsTable } from './Components/ImportsTable';
import type { csvLoaderResponse } from './Loaders/csvListLoader';

const CSVList = () => {
  const { list: csvUploads } = useLoaderData() as csvLoaderResponse;

  return (
    <div className="w-full h-full overflow-y-auto">
      <SettingsContent>
        <SettingsContent.Header title="Import CSV" />
        <SettingsContent.Body className="flex flex-col overflow-y-auto">
          {csvUploads.length ? (
            <ImportsTable />
          ) : (
            <div className="max-w-80 max-h-80 self-center my-auto">
              <BlankState
                icon={<DocumentIcon className="w-16 h-16" />}
                title={<Translate>No CSVs yet</Translate>}
                description={
                  <Translate>
                    Import CSV or ZIP files to create entities in bulk. Click &quot;New Import&quot;
                    to get started.
                  </Translate>
                }
              />
            </div>
          )}
        </SettingsContent.Body>
        <SettingsContent.Footer>
          <Button type="button" className="float-right flex flex-row gap-2 items-center">
            <PlusIcon className="w-4 h-4" />
            <Translate>Import CSV</Translate>
          </Button>
        </SettingsContent.Footer>
      </SettingsContent>
    </div>
  );
};

export { CSVList };
