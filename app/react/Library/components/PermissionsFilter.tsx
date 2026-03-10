import React, { useMemo } from 'react';
import FormGroup from 'app/DocumentForm/components/FormGroup';
import { MultiSelect } from 'app/Forms';
import { Aggregations } from 'shared/types/aggregations';
import { NeedAuthorization } from 'app/Auth';
import { Translate } from 'app/I18N';
import { Control } from 'react-redux-form';
import { connect } from 'react-redux';
import { ClientUserSchema } from 'app/apiResponseTypes';
import { IImmutable } from 'shared/types/Immutable';
import Immutable from 'immutable';
import { FiltrableLevel, filtrableLevels } from './FiltrablePermissionsLevels';

interface PermissionsValue {
  level: FiltrableLevel;
  refId: string;
}

export interface PermissionsFilterProps {
  onChange: (values: PermissionsValue[]) => void;
  aggregations: Aggregations;
}

const filteredAggregation = (aggregations: Aggregations, key: FiltrableLevel) => {
  const bucket = (aggregations?.all?.['_permissions.self']?.buckets || []).find(
    a => a.key === key
  ) || {
    filtered: { doc_count: 0 },
  };
  return bucket.filtered.doc_count;
};

const generateOptions = (aggregations: Aggregations) => [
  {
    label: <Translate>Can edit</Translate>,
    title: 'Can edit',
    value: 'write',
    icon: { type: 'Icons', _id: 'pencil-alt' },
    results: filteredAggregation(aggregations, 'write'),
  },
  {
    label: <Translate>Can view</Translate>,
    title: 'Can view',
    value: 'read',
    icon: { type: 'Icons', _id: 'file' },
    results: filteredAggregation(aggregations, 'read'),
  },
];

export const PermissionsFilterUncontrolled = connect(
  ({ user }: { user: IImmutable<ClientUserSchema> }) => ({
    user,
  })
)(({
  value = Immutable.fromJS([]),
  onChange,
  aggregations,
  user,
}: PermissionsFilterProps & {
  user: IImmutable<ClientUserSchema>;
  value: PermissionsValue[];
}) => {
  const refIds: string[] = useMemo(
    () => [user.get('_id') as string, ...(user.toJS().groups?.map(g => g._id as string) || [])],
    [user]
  );

  const onChangeHandler = (newValues: FiltrableLevel[]) => {
    onChange(
      newValues.reduce(
        (filters: PermissionsValue[], level: FiltrableLevel) =>
          filters.concat(
            refIds.map(refId => ({
              refId,
              level,
            }))
          ),
        []
      )
    );
  };

  const mappedValue = useMemo(
    () =>
      filtrableLevels.filter(level =>
        refIds.every(id => value.find(v => v.refId === id && v.level === level))
      ),
    [refIds, value]
  );

  const options = generateOptions(aggregations);

  return (
    <FormGroup key="permissions.level" className="admin-filter">
      <MultiSelect
        prefix="permissions.level"
        onChange={onChangeHandler}
        options={options}
        value={mappedValue}
      />
    </FormGroup>
  );
});

// eslint-disable-next-line react/no-multi-comp
const PermissionsFilterMultiselect = ({
  model,
  prefix,
  onChange,
  aggregations,
}: PermissionsFilterProps & { model: string; prefix: string }) => (
  // eslint-disable-next-line react/jsx-pascal-case
  <Control.select
    component={PermissionsFilterUncontrolled}
    model={`${model}.values`}
    prefix={prefix}
    onChange={onChange as any}
    // @ts-ignore
    aggregations={aggregations}
  />
);

// eslint-disable-next-line react/no-multi-comp
export const PermissionsFilter = ({ onChange, aggregations }: PermissionsFilterProps) => {
  const options = generateOptions(aggregations);
  const totalAggs = options.reduce((total, o) => total + o.results, 0);
  if (totalAggs === 0) {
    return null;
  }
  return (
    <NeedAuthorization roles={['editor', 'collaborator']}>
      <FormGroup key="permissions.level" className="admin-filter">
        <ul className="search__filter is-active">
          <li className="wide">
            <PermissionsFilterMultiselect
              model=".customFilters['permissions']"
              prefix="permissions"
              onChange={onChange}
              aggregations={aggregations}
            />
          </li>
        </ul>
      </FormGroup>
    </NeedAuthorization>
  );
};
