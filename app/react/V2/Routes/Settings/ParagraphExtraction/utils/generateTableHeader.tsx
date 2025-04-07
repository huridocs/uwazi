import React from 'react';
import { Translate } from 'app/I18N';
import { TableHeader } from '../components/TableHeader';

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
