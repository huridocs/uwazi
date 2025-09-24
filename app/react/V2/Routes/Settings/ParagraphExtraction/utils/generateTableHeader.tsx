import React from 'react';
// @ts-expect-error TS(2307): Cannot find module '../../I18N/index.js' or its co... Remove this comment to see the full error message
import { Translate } from '../../I18N/index.js';
import { TableHeader } from '../components/TableHeader';

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
