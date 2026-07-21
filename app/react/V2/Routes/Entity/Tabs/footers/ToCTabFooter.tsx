import React from 'react';
import type { FileType } from '#V2/api/entities/types.js';
import { ToCFooterBar, useToCPanel } from '#V2/Routes/Entity/Components/ToC/index.js';
import { EntityTabFooter } from '../EntityTabFooter.js';

type ToCTabFooterProps = {
  mainDocument?: FileType;
};

const ToCTabFooter = ({ mainDocument }: ToCTabFooterProps) => {
  const panel = useToCPanel({ toc: mainDocument?.toc, file: mainDocument });

  return (
    <EntityTabFooter>
      <ToCFooterBar panel={panel} />
    </EntityTabFooter>
  );
};

export { ToCTabFooter };
