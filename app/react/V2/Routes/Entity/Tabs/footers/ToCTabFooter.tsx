import React, { type ReactNode } from 'react';
import type { FileType } from '#V2/api/entities/types.js';
import { ToCFooterBar, useToCPanel } from '#V2/Routes/Entity/Components/ToC/index.js';
import { EntityTabFooter } from '../EntityTabFooter.js';

type ToCTabFooterProps = {
  mainDocument?: FileType;
  trailing?: ReactNode;
};

const ToCTabFooter = ({ mainDocument, trailing }: ToCTabFooterProps) => {
  const panel = useToCPanel({ toc: mainDocument?.toc, file: mainDocument });
  const editing = panel.tocState.isEditMode;

  return (
    <EntityTabFooter inset="side">
      <div className={!editing && trailing ? 'min-w-0 flex-1' : 'contents'}>
        <ToCFooterBar panel={panel} />
      </div>
      {editing ? null : trailing}
    </EntityTabFooter>
  );
};

export { ToCTabFooter };
