import React from 'react';

import { Translate } from '#app/I18N/index.js';

import { ClientPropertySchema } from '#app/istore.js';

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
  const nonMatchingStyles = 'bg-alert-50 text-alert-800';

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
