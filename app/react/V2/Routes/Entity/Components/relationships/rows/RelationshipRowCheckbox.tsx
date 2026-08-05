import React, { useEffect, useRef } from 'react';
import { t } from '#app/I18N/index.js';
import { checkboxInputClassName } from '#V2/Components/Forms/Checkbox.js';
import { useRelationshipsSelection } from '#V2/Routes/Entity/Components/context/index.js';

type RelationshipRowCheckboxProps = {
  relationshipIds: string[];
};

const RelationshipRowCheckbox = ({ relationshipIds }: RelationshipRowCheckboxProps) => {
  const {
    relationshipsEditMode: editMode,
    selectedRelationshipIds: selected,
    setSelectedRelationshipIds: setSelected,
  } = useRelationshipsSelection();
  const inputRef = useRef<HTMLInputElement>(null);

  const checked =
    relationshipIds.length > 0 &&
    relationshipIds.every(relationshipId => selected.has(relationshipId));
  const indeterminate =
    !checked && relationshipIds.some(relationshipId => selected.has(relationshipId));

  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  if (!editMode) {
    return null;
  }

  return (
    <span className="flex shrink-0 items-center" onClick={e => e.stopPropagation()}>
      <input
        ref={inputRef}
        type="checkbox"
        checked={checked}
        aria-label={t('System', 'Select relationship', null, false)}
        onChange={() => {
          setSelected(prev => {
            const next = new Set(prev);
            relationshipIds.forEach(relationshipId =>
              checked ? next.delete(relationshipId) : next.add(relationshipId)
            );
            return next;
          });
        }}
        className={`${checkboxInputClassName} h-3.5 w-3.5`}
      />
    </span>
  );
};

export { RelationshipRowCheckbox };
