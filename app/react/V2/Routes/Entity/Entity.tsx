/* eslint-disable max-statements */
/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { EntitySchema } from 'shared/types/entityType';
import { LoaderFunction, useLoaderData } from 'react-router';
import { PaneLayout } from 'app/V2/Components/Layouts/PaneLayout';

const entityLoader = (): LoaderFunction => async () => ({
  title: 'My entity',
});

const Entity = () => {
  const entity = useLoaderData() as EntitySchema;

  return (
    <div className="tw-content">
      <PaneLayout defaultWidthsPercents={[65, 35]}>
        <PaneLayout.Pane className="py-6 px-4">
          <h1>{entity.title}</h1>
        </PaneLayout.Pane>
        <PaneLayout.Pane className="py-6 px-4">
          <h1>Attachments</h1>
        </PaneLayout.Pane>
      </PaneLayout>
    </div>
  );
};

export { Entity, entityLoader };
