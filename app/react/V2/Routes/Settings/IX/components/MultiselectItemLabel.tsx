import React from 'react';
// @ts-expect-error TS(2307): Cannot find module '../../I18N/index.js' or its co... Remove this comment to see the full error message
import { Translate } from '../../I18N/index.js';
// @ts-expect-error TS(2307): Cannot find module '../../istore.js' or its corres... Remove this comment to see the full error message
import { ClientPropertySchema } from '../../istore.js';

const MultiselectItemLabel = ({
  isSelected,
  isSuggested,
  label,
  property,
}: {
  isSuggested: boolean;
  label: string;
  property: ClientPropertySchema;
  isSelected?: boolean;
}) => {
  const matchingStyles = 'bg-success-50 text-success-800';
  const nonMatchingStyles = 'bg-orange-50 text-orange-800';

  let styles = '';

  if (isSelected && isSuggested) {
    styles = matchingStyles;
  }

  if (!isSelected && isSuggested) {
    styles = nonMatchingStyles;
  }
  return (
    <Translate className={styles} context={property?.content}>
      {label}
    </Translate>
  );
};

export { MultiselectItemLabel };
