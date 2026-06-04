import React, { useState } from 'react';
import { useLoaderData, useLocation } from 'react-router';
import { Translate } from '#app/I18N/index.js';
import { Panel } from '#V2/Components/Layouts/Panel.js';
import { MetadataDisplay } from '#V2/Components/Metadata/MetadataDisplay.js';
import { Button } from '#V2/Components/UI/index.js';
import type { LoaderResponse } from '../types.js';
import { EditEntity } from '../EntityEditor/EditEntity.js';

const MetadataPanel = ({ headerLayout }: { headerLayout?: 'inline' | 'stacked' }) => {
  const { search } = useLocation();
  const { entity } = (useLoaderData() as LoaderResponse) || {};
  const [editMode, setEditMode] = useState(false);

  return (
    <Panel>
      <Panel.Body>
        {entity && !editMode && <MetadataDisplay entity={entity} headerLayout={headerLayout} />}
        {editMode && <EditEntity entity={entity} />}
      </Panel.Body>
      <Panel.Footer>
        <div className="flex flex-row items-center justify-between w-full gap-(--spacing-theme-3)">
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
        </div>
      </Panel.Footer>
    </Panel>
  );
};

export { MetadataPanel };
