import React from 'react';
import { Aggregations } from 'shared/types/aggregations';
import { FeatureToggle } from 'app/components/Elements/FeatureToggle';
import SelectFilter from 'app/Library/components/SelectFilter';
import FormGroup from 'app/DocumentForm/components/FormGroup';
import { t } from 'app/I18N';
import { NeedAuthorization } from 'app/Auth';

export interface FilterTocGenerationProps {
  onChange: () => void;
  aggregations: Aggregations;
}

const filteredAggregation = (aggregations: Aggregations, key: string) => {
  const bucket = (aggregations?.all?.generatedToc?.buckets || []).find(a => a.key === key) || {
    filtered: { doc_count: 0 },
  };
  return bucket.filtered.doc_count;
};

const options = (aggregations: Aggregations = { all: {} }) => [
  {
    label: t('System', 'Automatically generated'),
    value: true,
    results: filteredAggregation(aggregations, 'true'),
  },
  {
    label: t('System', 'Reviewed'),
    value: false,
    results: filteredAggregation(aggregations, 'false'),
  },
];

export const FilterTocGeneration = ({ onChange, aggregations }: FilterTocGenerationProps) => (
  <NeedAuthorization roles={['admin']}>
    <FeatureToggle feature="tocGeneration">
      <FormGroup key="generatedToc" className="admin-filter">
        <SelectFilter
          model=".customFilters.generatedToc"
          prefix="generatedToc"
          label={t('System', 'Automatic Table of Contents')}
          onChange={onChange}
          //@ts-ignore from the update typescript from 5.6.2 to 5.6.3
          options={options(aggregations)}
          showBoolSwitch={false}
        />
      </FormGroup>
    </FeatureToggle>
  </NeedAuthorization>
);
