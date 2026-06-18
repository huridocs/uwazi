import React from 'react';
import { t, Translate } from '#app/I18N/index.js';
import { DropdownListbox } from '#V2/Components/UI/DropdownListbox.js';
import {
  groupingOptions,
  type RelationshipsPanelGroupBy,
} from '#V2/formatters/relationships/relationshipsPanelGrouping.js';
import { groupingOptionLabel } from '../utils/relationshipsPanelLabels.js';
import { useRelationshipsPanelLayout } from '#V2/Routes/Entity/Components/context/index.js';

type RelationshipsGroupByControlProps = {
  axis: 'primary' | 'secondary';
  disabled?: boolean;
  excludeOption?: RelationshipsPanelGroupBy;
};

const RelationshipsGroupByControl = ({
  axis,
  disabled = false,
  excludeOption,
}: RelationshipsGroupByControlProps) => {
  const { groupBy, subGroupBy, setGroupBy, setSubGroupBy } = useRelationshipsPanelLayout();
  const value = axis === 'primary' ? groupBy : subGroupBy;
  const setValue = axis === 'primary' ? setGroupBy : setSubGroupBy;
  const visibleOptions = groupingOptions.filter(
    option => option.id === 'none' || option.id !== excludeOption
  );

  return (
    <DropdownListbox
      prefix={
        axis === 'primary' ? <Translate>Group by:</Translate> : <Translate>Then by:</Translate>
      }
      value={value}
      disabled={disabled}
      minWidthClass="min-w-[180px]"
      listAriaLabel={
        axis === 'primary'
          ? t('System', 'Group by:', null, false)
          : t('System', 'Then by:', null, false)
      }
      onChange={setValue}
      options={visibleOptions.map(option => ({
        id: option.id,
        label: groupingOptionLabel(option.id),
      }))}
    />
  );
};

export { RelationshipsGroupByControl };
