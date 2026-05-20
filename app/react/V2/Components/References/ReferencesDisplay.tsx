import React, { useMemo, useState } from 'react';
import { Square3Stack3DIcon, DocumentIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { Entity } from '#V2/api/entities/types.js';
import { formatReferences } from '#V2/formatters/index.js';
import { EntityReference } from '#V2/formatters/relationships/types.js';
import { Cluster, Point } from './Components/index.js';

const ReferencesDisplay = ({ entity, currentPage, onReferenceClick }) => {
  const [fullMode, setFullMode] = useState(true);

  const a = '';
  return (
    <div className="w-full h-full flex flex-col gap-2 items-center px-4">
      <button
        type="button"
        onClick={() => {
          setFullMode(!fullMode);
        }}
        className="cursor-pointer"
      >
        <Translate className="sr-only">Toggle timeline mode</Translate>
        {fullMode ? (
          <Square3Stack3DIcon className="w-4 h-4" />
        ) : (
          <DocumentIcon className="w-4 h-4" />
        )}
      </button>
      <div className="h-full w-4 flex flex-col items-center relative">
        <div className="h-full w-0.5 bg-(--color-theme-border-soft)" />
        <div className="absolute flex flex-col items-center">
          <Point color="#E17842" position={11} />
          <Cluster data={{ count: 45 }} position={25} />
          <Cluster data={{ count: 12 }} position={37} />
          <Point color="#AF3452" position={234} />
        </div>
      </div>
    </div>
  );
};

export { ReferencesDisplay };
