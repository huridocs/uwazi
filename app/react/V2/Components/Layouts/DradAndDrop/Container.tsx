import React, { memo } from 'react';
import type { FC } from 'react';
import { ItemTypes } from 'app/V2/shared/types';
import { DropZone } from './DropZone';

export const Container: FC = memo(() => (
  <div>
    <div style={{ overflow: 'hidden', clear: 'both' }}>
      <DropZone type={ItemTypes.FILTER} />
    </div>
  </div>
));
