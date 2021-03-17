import React from 'react';
import SelectFilter from 'app/Library/components/SelectFilter';
import FormGroup from 'app/DocumentForm/components/FormGroup';
import { Aggregations } from 'shared/types/Aggregations';
import { NeedAuthorization } from 'app/Auth';
import { t } from 'app/I18N';

export interface PermissionsFilterProps {
  onChange: () => void;
  aggregations: Aggregations;
}

const filteredAggregation = (aggregations: Aggregations, key: string) => {
  const bucket = (aggregations?.all?.permissions?.buckets || []).find(a => a.key === key) || {
    filtered: { doc_count: 0 },
  };
  return bucket.filtered.doc_count;
};

const options = (aggregations: Aggregations) => [
  {
    label: t('System', 'Write'),
    value: 'write',
    results: filteredAggregation(aggregations, 'write'),
  },
  {
    label: t('System', 'Read'),
    value: 'read',
    results: filteredAggregation(aggregations, 'read'),
  },
];

export const PermissionsFilter = ({ onChange, aggregations }: PermissionsFilterProps) => (
  <NeedAuthorization roles={['admin', 'editor', 'collaborator']}>
    <FormGroup key="permissions.level" className="admin-filter">
      <SelectFilter
        model=".customFilters['permissions.level']"
        prefix="permissions.level"
        label={t('System', 'Permissions')}
        onChange={onChange}
        options={options(aggregations)}
        showBoolSwitch={false}
      />
    </FormGroup>
  </NeedAuthorization>
);
