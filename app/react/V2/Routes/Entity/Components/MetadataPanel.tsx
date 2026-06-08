import React, { useState } from 'react';
import { useLoaderData } from 'react-router';
import { Translate } from '#app/I18N/index.js';
import { Entity } from '#V2/api/entities/types.js';
import { Panel } from '#V2/Components/Layouts/Panel.js';
import { MetadataDisplay } from '#V2/Components/Metadata/MetadataDisplay.js';
import { Button } from '#V2/Components/UI/index.js';
import { EditEntity } from '#V2/Components/Metadata/EntityEditor/EditEntity.js';
import type { LoaderResponse } from '../types.js';

const MetadataPanel = ({ headerLayout }: { headerLayout?: 'inline' | 'stacked' }) => {
  const { entity } = (useLoaderData() as LoaderResponse) || {};
  const [editMode, setEditMode] = useState(false);

  const onSave = (editedEntity?: Entity) => {
    console.log(editedEntity);
    setEditMode(false);
  };

  const formId = 'edit-entity-form';

  return (
    <Panel>
      <Panel.Body>
        {entity && !editMode && <MetadataDisplay entity={entity} headerLayout={headerLayout} />}
        {editMode && <EditEntity formId={formId} entity={entity} onSave={onSave} />}
      </Panel.Body>
      <Panel.Footer>
        <div className="flex flex-row items-center justify-between w-full gap-(--spacing-theme-3)">
          {editMode ? (
            <>
              <Button variant="secondary" onClick={() => setEditMode(false)}>
                <Translate>Cancel</Translate>
              </Button>
              <Button variant="primary" type="submit" form={formId}>
                <Translate>Save</Translate>
              </Button>
            </>
          ) : (
            <>
              <div className="flex gap-(--spacing-theme-2)">
                <Button variant="secondary" onClick={() => setEditMode(true)}>
                  <Translate>Edit</Translate>
                </Button>
                <Button variant="secondary">
                  <Translate>Share</Translate>
                </Button>
              </div>
              <Button variant="danger">
                <Translate>Delete</Translate>
              </Button>
            </>
          )}
        </div>
      </Panel.Footer>
    </Panel>
  );
};

export { MetadataPanel };
