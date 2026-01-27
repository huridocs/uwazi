import React from 'react';

import { Translate } from '#app/I18N/index.js';
import { TableHeader } from '#V2/Routes/Settings/ParagraphExtraction/components/TableHeader.js';

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
