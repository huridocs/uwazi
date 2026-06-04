import React from 'react';
import { Link, useLocation } from 'react-router';
import { Translate } from '#app/I18N/index.js';
import { Panel } from '#V2/Components/Layouts/Panel.js';
import { MetadataDisplay } from '#V2/Components/Metadata/MetadataDisplay.js';
import { Entity } from '#V2/api/entities/types.js';
import { Button } from '#V2/Components/UI/index.js';

const MetadataPanel = ({
  entity,
  headerLayout,
}: {
  entity: Entity;
  headerLayout?: 'inline' | 'stacked';
}) => {
  const { search } = useLocation();

  return (
    <Panel>
      <Panel.Body>
        <MetadataDisplay entity={entity} headerLayout={headerLayout} />
      </Panel.Body>
      <Panel.Footer>
        <div className="flex flex-row items-center justify-between w-full gap-(--spacing-theme-3)">
          <div className="flex gap-(--spacing-theme-2)">
            <Link to={{ pathname: 'edit', search }}>
              <Button variant="secondary">
                <Translate>Edit</Translate>
              </Button>
            </Link>
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
