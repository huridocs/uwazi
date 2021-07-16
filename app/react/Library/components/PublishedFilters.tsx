import React from 'react';
import SelectFilter from 'app/Library/components/SelectFilter';
import FormGroup from 'app/DocumentForm/components/FormGroup';
import { Aggregations } from 'shared/types/aggregations';
import { NeedAuthorization } from 'app/Auth';
import { Translate } from 'app/I18N';
import { Icon } from 'app/UI';

export interface PublishedFiltersProps {
  onChange: () => void;
  aggregations: Aggregations;
}

const filteredAggregation = (aggregations: Aggregations) => {
  const published = (aggregations?.all?.published?.buckets || []).find(a => a.key === 'true') || {
    filtered: { doc_count: 0 },
  };

  const restricted = (aggregations?.all?.published?.buckets || []).find(a => a.key === 'false') || {
    filtered: { doc_count: 0 },
  };

  return {
    published: published.filtered.doc_count || 9999,
    restricted: restricted.filtered.doc_count || 9999,
  };
};

const generateOptions = (aggregations: Aggregations) => [
  {
    label: (
      <>
        <Icon icon="globe-africa" />
        &nbsp;
        <Translate>Published</Translate>
      </>
    ),
    title: 'Published',
    value: 'published',
    results: filteredAggregation(aggregations).published,
  },
  {
    label: (
      <>
        <Icon icon="lock" />
        &nbsp;
        <Translate>Restricted</Translate>
      </>
    ),
    title: 'Restricted',
    value: 'restricted',
    results: filteredAggregation(aggregations).restricted,
  },
];

export const PublishedFilters = ({ onChange, aggregations }: PublishedFiltersProps) => {
  const options = generateOptions(aggregations);
  // const totalAggs = options.reduce((total, o) => total + o.results, 0);
  // if (totalAggs === 0) {
  //   return null;
  // }
  return (
    <NeedAuthorization roles={['admin', 'editor', 'collaborator']}>
      <FormGroup key="publishedStatus" className="admin-filter">
        <SelectFilter
          model=".publishedStatus"
          prefix="publishedStatus"
          onChange={onChange}
          options={options}
          showBoolSwitch={false}
        />
      </FormGroup>
    </NeedAuthorization>
  );
};
