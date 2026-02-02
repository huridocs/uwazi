import React from 'react';

import { Translate } from '#app/I18N/index.js';
import { TableHeader } from '../components/TableHeader.js';

const generateTableHeader =
  (
    translationKey: string,
    options?: {
      className?: string;
    }
  ) =>
  () => (
    <TableHeader className={options?.className || ''}>
      {translationKey && <Translate>{translationKey}</Translate>}
    </TableHeader>
  );

export { generateTableHeader };
