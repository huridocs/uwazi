import React from 'react';
import { ListBulletIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { BlankState } from '#V2/Components/UI/index.js';

const ToCPanelEmptyState = () => (
  <BlankState
    icon={<ListBulletIcon className="h-7 w-7 text-gray-900 rounded-full bg-gray-300 p-1" />}
    title={<Translate>No Table of contents</Translate>}
    description={
      <Translate>
        You can start by selecting text in the document and clicking the “Add to ToC” button.
      </Translate>
    }
  />
);

export { ToCPanelEmptyState };
