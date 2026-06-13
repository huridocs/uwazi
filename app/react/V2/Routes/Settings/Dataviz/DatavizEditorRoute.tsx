import React, { useMemo, useState } from 'react';
import { LoaderFunction, useLoaderData, useNavigate } from 'react-router';
import { IncomingHttpHeaders } from 'http';
import * as datavizAPI from '#V2/api/dataviz/index.js';
import * as templatesAPI from '#V2/api/templates/index.js';
import { DatavizEditor } from '#V2/Dataviz/editor/DatavizEditor.js';
import { DatavizApiProvider } from '#V2/Dataviz/api/DatavizApiContext.js';
import { createHttpDatavizApi, isPersistedId } from '#V2/Dataviz/api/httpDatavizApi.js';
import type { DatavizDefinition } from '#shared/types/datavizSchema.js';
import { FetchResponseError } from '#shared/JSONRequest.js';
import { createLocalDraftDefinition } from './createDraftDatavizInput.js';
import { ConfirmationModal } from '#V2/Components/UI/index.js';
import { t, Translate } from '#app/I18N/index.js';
import { useRequestStatus } from '#V2/atoms/requestStatusAtom.js';

const datavizNewLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async () => {
    const templates = await templatesAPI.get(headers);
    if (templates instanceof FetchResponseError) {
      throw templates;
    }
    const templateId = templates[0]?._id;
    return createLocalDraftDefinition({ templateId });
  };

const datavizEditorLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async ({ params }) => {
    const definition = await datavizAPI.getById(params.id!, headers);
    if (definition instanceof FetchResponseError) {
      throw definition;
    }
    return definition;
  };

const DatavizEditorRoute = () => {
  const initialDefinition = useLoaderData() as DatavizDefinition;
  const api = useMemo(() => createHttpDatavizApi(), []);
  const navigate = useNavigate();
  const { notify } = useRequestStatus();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = async () => {
    setConfirmDelete(false);
    if (!isPersistedId(initialDefinition.id)) {
      navigate('/settings/dataviz');
      return;
    }
    try {
      await api.deleteDefinition(initialDefinition.id);
      notify('success', t('System', 'Deleted successfully.', null, false));
      navigate('/settings/dataviz');
    } catch {
      notify('error', t('System', 'An error occurred', null, false));
    }
  };

  return (
    <DatavizApiProvider api={api}>
      <div className="flex h-full min-h-0 flex-col" data-testid="settings-dataviz-editor">
        <DatavizEditor
          initialDefinition={initialDefinition}
          onDeleteRequest={() => setConfirmDelete(true)}
        />
      </div>
      {confirmDelete && (
        <ConfirmationModal
          header={t('System', 'Delete', null, false)}
          body={
            <Translate>
              Are you sure you want to delete this visualization? This action cannot be undone.
            </Translate>
          }
          onAcceptClick={handleDelete}
          onCancelClick={() => setConfirmDelete(false)}
          dangerStyle
        />
      )}
    </DatavizApiProvider>
  );
};

export { DatavizEditorRoute, datavizEditorLoader, datavizNewLoader };
