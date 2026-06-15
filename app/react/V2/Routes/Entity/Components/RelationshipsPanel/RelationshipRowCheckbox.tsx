import React from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { t } from '#app/I18N/index.js';
import { checkboxInputClassName } from '#V2/Components/Forms/Checkbox.js';
import { relationshipsEditModeAtom, selectedRelationshipIdsAtom } from './relationshipsAtom.js';

type RelationshipRowCheckboxProps = {
  relationshipId: string;
};

const RelationshipRowCheckbox = ({ relationshipId }: RelationshipRowCheckboxProps) => {
  const editMode = useAtomValue(relationshipsEditModeAtom);
  const [selected, setSelected] = useAtom(selectedRelationshipIdsAtom);

  if (!editMode) {
    return null;
  }

  const checked = selected.has(relationshipId);

  return (
    <span className="flex shrink-0 items-center" onClick={e => e.stopPropagation()}>
      <input
        type="checkbox"
        checked={checked}
        aria-label={t('System', 'Select relationship', null, false)}
        onChange={() => {
          setSelected(prev => {
            const next = new Set(prev);
            if (checked) {
              next.delete(relationshipId);
            } else {
              next.add(relationshipId);
            }
            return next;
          });
        }}
        className={`${checkboxInputClassName} h-3.5 w-3.5`}
      />
    </span>
  );
};

export { RelationshipRowCheckbox };
