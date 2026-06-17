import React from 'react';
import { t } from '#app/I18N/index.js';
import { checkboxInputClassName } from '#V2/Components/Forms/Checkbox.js';
import { useEntityScopedContext } from '../../context/EntityScopedProvider.js';

type RelationshipRowCheckboxProps = {
  relationshipId: string;
};

const RelationshipRowCheckbox = ({ relationshipId }: RelationshipRowCheckboxProps) => {
  const {
    relationshipsEditMode: editMode,
    selectedRelationshipIds: selected,
    setSelectedRelationshipIds: setSelected,
  } = useEntityScopedContext();

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
