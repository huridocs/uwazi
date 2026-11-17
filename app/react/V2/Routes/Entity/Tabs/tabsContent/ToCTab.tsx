import React from 'react';
import type { FileType } from '#V2/api/entities/types.js';
import { ToCView, useToCPanel } from '#V2/Routes/Entity/Components/ToC/index.js';

type ToCTabProps = {
  mainDocument?: FileType;
  onRevealDocument?: () => void;
};

const ToCTab = ({ mainDocument, onRevealDocument }: ToCTabProps) => {
  const panel = useToCPanel({
    toc: mainDocument?.toc,
    file: mainDocument,
    onRevealDocument,
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <ToCView generatedToc={mainDocument?.generatedToc} panel={panel} />
    </div>
  );
};

export { ToCTab };
