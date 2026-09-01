import React from 'react';
import { useAtomValue } from 'jotai';
import { Translate } from '#app/I18N/index.js';
import { localeAtom } from '#V2/atoms/translationsAtoms.js';
import {
  formatMetadataTimestamp,
  metadataDisplayPresets,
} from '#V2/Components/Metadata/display/index.js';
import type { Entity } from '#V2/api/entities/types.js';

type SystemDatesLineProps = {
  entity: Entity;
};

const SystemDatesLine = ({ entity }: SystemDatesLineProps) => {
  const locale = useAtomValue(localeAtom);
  const displayContext = { ...metadataDisplayPresets.compact, locale };
  const created =
    typeof entity.creationDate === 'number'
      ? formatMetadataTimestamp(entity.creationDate, displayContext)
      : '';
  const edited =
    typeof entity.editDate === 'number'
      ? formatMetadataTimestamp(entity.editDate, displayContext)
      : '';

  if (!created && !edited) {
    return null;
  }

  return (
    <p data-testid="entity-system-dates" className="text-nano text-ink-tertiary">
      {created ? (
        <>
          <Translate>Created</Translate> {created}
        </>
      ) : null}
      {created && edited ? ' · ' : null}
      {edited ? (
        <>
          <Translate>Edited</Translate> {edited}
        </>
      ) : null}
    </p>
  );
};

export { SystemDatesLine };
