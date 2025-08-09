import React from 'react';
import { Translate } from 'app/I18N';
import { ClientPropertySchema } from 'app/istore';

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
