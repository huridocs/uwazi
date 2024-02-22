import React from 'react';
import { LoaderFunction, useLoaderData } from 'react-router-dom';
import { IncomingHttpHeaders } from 'http';
import { Translate } from 'app/I18N';
import { FileType } from 'shared/types/fileType';
import { getByType } from 'V2/api/files';
import { Table } from 'app/V2/Components/UI';
import { SettingsContent } from 'V2/Components/Layouts/SettingsContent';
import { createColumns } from './components/UploadsTable';

const customUploadsLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction<FileType[]> =>
  async () => {
    const files = await getByType('custom', headers);
    return files;
  };

const CustomUploads = () => {
  const files = useLoaderData() as FileType[];

  return (
    <div className="tw-content" style={{ width: '100%', height: '100%', overflowY: 'auto' }}>
      <SettingsContent>
        <SettingsContent.Header title="Custom Uploads" />

        <SettingsContent.Body>
          <Table<FileType>
            enableSelection
            onSelection={() => {}}
            columns={createColumns()}
            data={files}
            title={<Translate>Custom Uploads</Translate>}
          />
        </SettingsContent.Body>

        {/* <SettingsContent.Footer className="text-end">
          <Button
            styling="solid"
            color="success"
            disabled={!hasChanges}
            onClick={async () => handleSave()}
          >
            <Translate>Save</Translate>
          </Button>
        </SettingsContent.Footer>*/}
      </SettingsContent>
    </div>
  );
};

export { CustomUploads, customUploadsLoader };
