import React from 'react';
import { Translate } from 'app/I18N';
import { TableHeader } from '../components/TableHeader';

// in case there will be aesthetic changes to the table header,
//  we can change the component here but its probably an overkill now
const generateTableHeader =
  (
    translationKey: string,
    options?: {
      className?: string;
    }
  ) =>
  () => (
    <TableHeader className={options?.className}>
      {translationKey && <Translate>{translationKey}</Translate>}
    </TableHeader>
  );

export { generateTableHeader };
