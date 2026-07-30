import React, { ReactNode } from 'react';
import { Translate } from '#app/I18N/index.js';
import type { MetadataProperty } from '#V2/formatters/types.js';

const GROUPED_GEOLOCATION_LABEL = 'Grouped geolocation properties';

const isGroupedGeolocation = (data: MetadataProperty): boolean =>
  data.type === 'geolocation' && Boolean(data.propertyGroup?.length);

const groupedGeolocationTitleNode = (hideLabel?: boolean, visibleClassName?: string): ReactNode => (
  <Translate className={hideLabel ? 'sr-only' : visibleClassName}>
    {GROUPED_GEOLOCATION_LABEL}
  </Translate>
);

const fieldTitle = (label: string, translationContext: string, hideLabel?: boolean) => (
  <Translate className={hideLabel ? 'sr-only' : undefined} context={translationContext}>
    {label}
  </Translate>
);

const specializedCardTitle = (data: MetadataProperty, translationContext: string): ReactNode => {
  if (isGroupedGeolocation(data)) {
    return groupedGeolocationTitleNode(data.hideLabel);
  }
  return fieldTitle(data.label, translationContext, data.hideLabel);
};

export {
  GROUPED_GEOLOCATION_LABEL,
  fieldTitle,
  groupedGeolocationTitleNode,
  isGroupedGeolocation,
  specializedCardTitle,
};
