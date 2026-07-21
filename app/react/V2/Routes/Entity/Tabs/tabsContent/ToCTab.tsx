import React from 'react';
import type { FileType } from '#V2/api/entities/types.js';
import { ToCView, useToCPanel } from '#V2/Routes/Entity/Components/ToC/index.js';

type ToCTabProps = {
  mainDocument?: FileType;
};

const ToCTab = ({ mainDocument }: ToCTabProps) => {
  const panel = useToCPanel({ toc: mainDocument?.toc, file: mainDocument });

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <ToCView generatedToc={mainDocument?.generatedToc} panel={panel} />
    </div>
  );
};

export { ToCTab };
